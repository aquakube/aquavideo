import React from 'react';

import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { Subject, debounceTime } from 'rxjs';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

import Header from './Header';
import AppDrawer from './AppDrawer';
import Video from './Video';

const drawerWidth = 350;
const defaultEgg = 'rgba(0,0,0,0.87)';

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(0),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);


function getLayoutStyles(layout) {
  if (layout === '1x1') {
    return { gridTemplateColumns: '1fr', gridAutoRows: '100%' };
  }

  if (layout === '2x2') {
    return { gridTemplateColumns: '1fr 1fr', gridAutoRows: 'minmax(50%, auto)' };
  }

  if (layout === '3x3') {
    return { gridTemplateColumns: '1fr 1fr 1fr', gridAutoRows: '50%' };
  }
}

async function asyncRetry(fn, retriesLeft = 3, interval = 1000) {
  try {
    return await fn;
  } catch (error) {
    if (retriesLeft) {
      await new Promise(r => setTimeout(r, interval));
      return await asyncRetry(fn, retriesLeft - 1, interval);
    }
    throw new Error(error);
  }
}

export default class App extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      errored: false,
      eventSourceFailed: false,
      drawerOpen: false,
      cameraMap: {},
      selectedCameras: [],
      cameraMetrics: {},
      cameraGroupings: {},
      layout: '2x2',
      groupFilters: [],
      onlineFilter: false,
      egg: defaultEgg,
      layoutStyle: {
        gridTemplateColumns: '1fr 1fr',
        gridAutoRows: 'minmax(50%, auto)'
      },
    };

    // this.url = 'http://10.0.3.252:30210'
    this.url = window.location.origin;

    this.onNewEvent = this.onNewEvent.bind(this);
    this.onChangeLayout = this.onChangeLayout.bind(this);
    this.handleCameraToggle = this.handleCameraToggle.bind(this);
    this.updateQueryParams = this.updateQueryParams.bind(this);
    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.onEventSourceError = this.onEventSourceError.bind(this);
    this.erroredTimeout = undefined;
    this.eventSource = undefined;

    this.reloadEventsSubject = new Subject();
  }

  async componentDidMount() {
    this.reloadEventsSubject
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.subscribeToCameras();
      });

    try {
      await this.initialize();
    } catch(err) {
      console.error(err);
      this.setState({ errored: true }, () => {
        this.erroredTimeout = setTimeout(() => {
          window.location.reload();
        }, 10000);
      });
    }
  }

  componentWillUnmount() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    if (this.erroredTimeout) {
      clearTimeout(this.erroredTimeout);
    }
  }

  async initialize() {

    const results = await asyncRetry(Promise.all([
      this.fetchCameraMap(),
      this.fetchCameraGroups()
    ]));

    const { cameraMap } = results[0];
    const cameraGroupings = results[1];
    const { selectedCameras, groupFilters, onlineFilter, layout, layoutStyle, egg } = this.retrieveState();

    // don't want to show cameras that don't exist
    const appSelectedCameras = selectedCameras.filter(camera => cameraMap[camera]);

    this.setState({
      cameraMap,
      selectedCameras: appSelectedCameras,
      drawerOpen: appSelectedCameras.length === 0,
      groupFilters,
      onlineFilter,
      cameraGroupings,
      layout,
      layoutStyle,
      egg,
      loading: false
    }, () => {
      this.reloadEventsSubject.next();
    });
  }

  retrieveState() {
    try {
      const params = new URLSearchParams(window.location.search);
      const cameras = JSON.parse(decodeURIComponent(params.get('cameras')));
      const groups = JSON.parse(decodeURIComponent(params.get('groups')));
      const online = decodeURIComponent(params.get('online')) === 'true';
      const layout = JSON.parse(decodeURIComponent(params.get('layout'))) || '2x2';
      const egg = params.get('egg') || defaultEgg;
      const layoutStyle = getLayoutStyles(layout);

      return {
        selectedCameras: Array.isArray(cameras) ? cameras : [],
        groupFilters: Array.isArray(groups) ? groups : [],
        onlineFilter: online || false,
        layoutStyle: layoutStyle,
        layout: layout,
        egg: egg
      };
    } catch (err) {
      console.warn(err);
    }

    return {
      selectedCameras: [],
      groupFilters: [],
      layout: '2x2',
      layoutStyle: getLayoutStyles('2x2'),
      egg: defaultEgg
    };
  }

  async fetchCameraMap() {
    const cameraMap = await fetch(`${this.url}/api/cameras`)
      .then(response => response.json());

    return { cameraMap };
  }

  async fetchCameraGroups() {
    const cameraGroupings = await fetch(`${this.url}/api/groups`)
      .then(response => response.json());

    return cameraGroupings
  }

  subscribeToCameras() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const cameras = this.state.selectedCameras.join(',');
    this.eventSource = new EventSource(`${this.url}/api/camera_events?cameras=${cameras}`);
    this.eventSource.onmessage = this.onNewEvent;
    this.eventSource.onerror = this.onEventSourceError;
  }

  onEventSourceError(error) {
    console.error('event source failed', error);
    this.setState({ eventSourceFailed: true });
  }

  onNewEvent(message) {
    try {
      const event = JSON.parse(message.data);

      if (event.context.type === "aquavid.metrics.event") {

        const delay = Date.now() - Date.parse(event.context.timestamp);
        const messageIsNew = delay >= -1000 && delay < 10000;

        if (messageIsNew) {
          this.setState({
            cameraMetrics: event.data || {},
            eventSourceFailed: false
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }

  handleCameraToggle(cameraName) {
    const { selectedCameras } = this.state;

    const currentIndex = selectedCameras.indexOf(cameraName);
    const newChecked = [...selectedCameras];

    if (currentIndex === -1) {
      // cannot select more than 9 cameras
      if (selectedCameras.length >= 9) {
        return;
      }
      newChecked.push(cameraName);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    this.setState({selectedCameras: newChecked }, () => {
      this.updateQueryParams();
    });
  }

  onChangeLayout(layout) {
    this.setState({ layout, layoutStyle: getLayoutStyles(layout)}, () => {
      this.updateQueryParams(false)
    });
  }

  onUpdateFilters(filters) {
    const { onlineFilter, groupFilters } = filters;

    this.setState({ onlineFilter, groupFilters }, () => {
      this.updateQueryParams(false);
    });
  }

  updateQueryParams(reloadEvents=true) {
    // update query parameters
    const params = new URLSearchParams(window.location.search);
    params.set('cameras', encodeURIComponent(JSON.stringify(this.state.selectedCameras)));
    params.set('groups', encodeURIComponent(JSON.stringify(this.state.groupFilters)));
    params.set('layout', encodeURIComponent(JSON.stringify(this.state.layout)));
    params.set('online', encodeURIComponent(this.state.onlineFilter ? 'true' : 'false'));
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);

    // subscribe to new cameras
    if (reloadEvents) {
      this.reloadEventsSubject.next();
    }
  }

  toggleDrawer() {
    this.setState({ drawerOpen: !this.state.drawerOpen });
  }

  renderCameraGrid() {
    const { selectedCameras, cameraMetrics, cameraMap, layoutStyle, layout, egg, drawerOpen } = this.state;

    return (
      <div className='grid__container' style={{...layoutStyle, backgroundColor: egg === defaultEgg ? '#fff' : egg}}>
        {selectedCameras.map((camera, index) => (
          <Video
            key={camera}
            layout={layout}
            drawerOpen={drawerOpen}
            cameraName={camera}
            camera={cameraMap?.[camera]}
            type={cameraMap?.[camera]?.type || 'default'}
            metrics={cameraMetrics?.[camera]}
            handleCameraToggle={this.handleCameraToggle}
          />
        ))}
      </div>
    );
  }

  renderLoading() {
    return (
      <div className='loading'>      
        <div className='loading__text'>
          <LinearProgress size={200} thickness={15} sx={{width: '100%', height: 7, borderRadius: 2}}/>
          <p>Loading Aquavid</p>
        </div>
      </div>
    );
  }

  renderErrored() {
    return (
      <div className='errored'>
        <div className='errored__text'>
          <ErrorIcon sx={{ fontSize: 80 }}/>
          Aquavid has encountered an error.
          <div className='errored__text--small'>
            Please refresh this page to try again.
          </div>
          <Button 
            variant="contained"
            onClick={() => window.location.reload()}
          >
              Reload
          </Button>
        </div>
      </div>
    );
  }

  renderDisclaimer() {
    const { eventSourceFailed } = this.state;

    if (!eventSourceFailed) {
      return <></>
    }

    return (
      <div className="disclaimer">
          <span className="disclaimer__offline">
              <WarningIcon />
              <span className="disclaimer__offline__text">
                Disconnected. Please wait while we reconnect you.
              </span>
          </span>
      </div>
    );
  }

  render() {
    const {
      egg,
      layout,
      errored,
      loading,
      cameraMetrics,
      cameraMap,
      selectedCameras,
      drawerOpen,
      cameraGroupings,
      groupFilters,
      onlineFilter,
    } = this.state;

    if (errored) {
      return this.renderErrored();
    }

    if (loading) {
      return this.renderLoading();
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <CssBaseline />

          <Header
            egg={egg}
            layout={layout}
            toggleDrawer={this.toggleDrawer}
            updateQueryParams={this.updateQueryParams}
            onChangeLayout={this.onChangeLayout}
          />

          <AppDrawer
            cameraMetrics={cameraMetrics}
            cameraMap={cameraMap}
            selectedCameras={selectedCameras}
            cameraGroupings={cameraGroupings}
            drawerOpen={drawerOpen}
            drawerWidth={drawerWidth}
            groupFilters={groupFilters}
            onlineFilter={onlineFilter}
            onUpdateFilters={(filters) => this.onUpdateFilters(filters)}
            handleCameraToggle={this.handleCameraToggle}
          />

          <Main 
            open={drawerOpen}
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Toolbar variant="dense" />
            {this.renderDisclaimer()}
            {this.renderCameraGrid()}
          </Main>

        </Box>
    );
  }

}
