import React from 'react';

import Hls from 'hls.js';
import { v4 as uuidv4 } from 'uuid';

import {IVEViewer} from './jsm/immervision-sdk.js';
import {Control} from './jsm/lib/control.js';

export default class ImmervisonPlayer extends React.PureComponent {

  constructor(props) {
      super(props);
      this.state = {
        id: uuidv4(),
      };

      this.hlsInstance = null;
      this.play = null;
      this.manifestParsed = false;
      this.retryTimer = null;
      this.retryDelay = 5000;
      this.video = document.createElement('video');
  }

  componentDidMount() {
    this.configureHLS();
    this.configureImmervision();
  }

  componentDidUpdate() {
    // this is hack due to drawerOpen not actually changing the
    // width of the drawer immediately
    setTimeout(() => this.player?.view?.onWindowResize(), 200);
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.hlsInstance?.stopLoad();
    this.hlsInstance?.destroy();
    this.player?.destroy();
    this.video?.remove();
  }

  configureHLS() {
    console.debug('[IMMERVISION] Configuring HLS')
    const hlsInstance = new Hls(
      {
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = true;
        },
        liveMaxLatencyDuration: 5,
        liveSyncDuration: 1,
      }
    );

    hlsInstance.loadSource(this.props.url);
    hlsInstance.attachMedia(this.video);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, async () => {
      console.debug('[IMMERVISION] Loaded manifest!')
      try {
        await this.video.play();
        console.debug('[IMMERVISION] Automatic playback started!');
      } catch(error) {
        console.warn('[IMMERVISION] Playback failed!', error);
        this.props.onError(error);
      }

    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      // only report/handle errors if they are fatal
      // hlsjs should automatically handle non fatal errors
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // playlist file 404'd (probably)
            // try to recover by start/restart playlist/fragment loading
            // this is only effective if MANIFEST_PARSED event has been triggered and video element has been attached to hls object.
            // if the manifest has not been loaded, then destroy reconfigure the hls instance until a manifest is parsed.
            clearTimeout(this.retryTimer);
            if (!this.manifestParsed) {
              console.debug('[IMMERVISION] Restart on manifest not found');
              this.retryTimer = setTimeout(() => {
                this.hlsInstance?.stopLoad();
                this.hlsInstance?.destroy();
                this.player?.destroy();
                delete this.hlsInstance;
                this.configureHLS();
                this.configureImmervision();
              }, this.retryDelay);
            } else {
              console.debug('[IMMERVISION] Restart on network error')
              this.retryTimer = setTimeout(() => hlsInstance.startLoad(), this.retryDelay);
            }
            
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.debug('[IMMERVISION] Fatal media error encountered, try to recover');
            hlsInstance.recoverMediaError();
            break;
          default:
            // cannot recover
            console.error('[IMMERVISION] Cannot recover!');
            break;
        }
      }

    });

  }

  configureImmervision() {
    console.debug('[IMMERVISION] Configuring Immervision');
    const container = document.getElementById(this.state.id);
    const player = new IVEViewer(
        {
            target: container
        },
        {
            video: this.video,
            widthSegments: 96,
            calibration: {
                "x": 50,
                "y": 49,
                "w": 48,
                "h": 89,
                "r": 0,
            },
            RPL: "C1ZZV",
            orientation:  "WALL",
            QrCodeMode: "off",
        }
    );
    
    // set zoom to further out for easier fov
    const maxZoom = player.view.maxZoom;
    player.view.setZoom(maxZoom);
    
    // add camera control
    new Control(container, {
      onZoom: player.view.zoom,
      onRotate: player.view.rotate,
    });

    this.player = player;
  }

  render() {
      return (
        <div id={this.state.id} style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none'
        }}>
        </div>
      )
  }
}