import React from 'react';
import IconButton from '@mui/material/IconButton';

import ImmervisonPlayer from './immervision/Player';
import HlsVideoPlayer from './HLSPlayer';

import Box from '@mui/material/Box';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import WarningIcon from '@mui/icons-material/Warning';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import PingIcon from './PingIcon';

function isNotDefined(value) {
    return value === null || value === undefined;
}

function isNumber(value) {
    return typeof value === 'number';
}

function parseHLSDomain() {
    const domain = window.location.hostname;
    let subdomain = domain.split('.');
    subdomain[0] = 'hls';
    return subdomain.join('.');
}

export default class Video extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            retry: false,
        };

        this.onVideoError = this.onVideoError.bind(this);
        this.onVideoRecover = this.onVideoRecover.bind(this);
    };

    onVideoError(event) {
        console.warn(`${this.props.cameraName} errored`);
    }

    onVideoRecover() {
        console.debug(`${this.props.cameraName} recovered`);
    }

    renderLoading() {
        const { metrics } = this.props;

        const age = metrics?.age;
        const progress = isNumber(age) ? parseInt((age / 60) * 100) : 0;

        return (
            <Box sx={{ position: 'relative', display: 'inline-flex'}}>
                <CircularProgress variant="determinate" value={progress} size={75} thickness={3} />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{fontSize: "1rem"}}
                    >
                        {`${progress}%`}
                    </Typography>
                </Box>
            </Box>
        )
    }

    renderPlayer() {
        const { type, cameraName, metrics, layout, drawerOpen } = this.props;

        //const url = `http://10.0.3.252:30150/api/hls/v1/${cameraName}.m3u8`;
        const url = `https://${parseHLSDomain()}/api/hls/v1/${cameraName}.m3u8`;
        //const url = `https://hls.devglobal.aquakube.com/api/hls/v1/${cameraName}.m3u8`;

        const ping = metrics?.ping;
        const available = metrics?.available;
        const age = metrics?.age;

        const noMetricsAvailable = isNotDefined(available) && isNotDefined(age);
        const streamIsLoading = !available && isNumber(age) && age < 60;
        const streamIsUnavailable = available === 0;
        const cameraIsOffline = ping === 0;

        // stream should be just starting up and loading
        if (streamIsLoading || noMetricsAvailable) {
            return this.renderLoading();
        }

        if (streamIsUnavailable) {
            if (cameraIsOffline) {
                return <p className='camera__view__unavailable'>
                    <VideocamOffIcon sx={{color: '#ffc63d'}} />
                    Camera is offline
                </p>
            }
        
            return <p className='camera__view__unavailable'>
                <WarningIcon sx={{color: '#ffc63d'}} />
                Stream is unavailable
            </p>
        }

        if (type === 'otaq') {
            return (
                <ImmervisonPlayer
                    retry={this.state.retry}
                    onError={this.onVideoError}
                    onRecover={this.onVideoRecover}
                    drawerOpen={drawerOpen}
                    url={url}
                    layout={layout}
                />
            )
        }

        return (
            <HlsVideoPlayer
                retry={this.state.retry}
                onError={this.onVideoError}
                onRecover={this.onVideoRecover}
                url={url}
            />
        )
    }

    renderHeader() {
        const { cameraName, camera, metrics } = this.props;

        return (
            <div className='camera__view__header'>
                <div className='camera__view__header__title'>
                    <PingIcon metric={metrics?.ping} />
                    <div>
                        {camera?.title || cameraName} {' '}
                        <span>
                            ({metrics?.bitrate ? metrics?.bitrate?.toFixed(2) : '-'} Mbps)
                        </span>
                    </div>
                </div>
                <Tooltip title="Remove" arrow>
                    <IconButton
                        color="inherit"
                        sx={{ mr: 2, marginRight: 0}}
                        onClick={() => this.props.handleCameraToggle(cameraName)}
                    >
                        <CheckBoxIcon  style={{ fontSize: 15 }}/> 
                    </IconButton>
                </Tooltip>
            </div>
        )
    }

    render() {
        return (
            <div className='camera__view' style={this.props.style}>
                {this.renderHeader()}
                {this.renderPlayer()}
            </div>
        );
    }

}