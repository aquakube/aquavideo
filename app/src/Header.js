import React from 'react';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import GridViewSharpIcon from '@mui/icons-material/GridViewSharp';
import ViewModuleSharpIcon from '@mui/icons-material/ViewModuleSharp';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import ViewStreamSharpIcon from '@mui/icons-material/ViewStreamSharp';
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

import Logo from './Logo';

export default class Header extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
      const { layout, toggleDrawer, onChangeLayout, egg } = this.props;

      return <>
        <AppBar sx={{ boxShadow: 'none', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar
            variant="dense"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#e3e5e8',
              color: egg,
            }}
          >
            <div className="toolbar__menu">
              <IconButton
                color="inherit"
                onClick={toggleDrawer}
                edge="start"
                sx={{mr: 2}}
              >
                <MenuIcon />
              </IconButton>
              <Logo egg={egg} />
              <Typography variant="button" component="div" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                AquaVid
              </Typography>
            </div>

            <div className="toolbar__layouts">
              <IconButton
                color="inherit"
                className={layout === '1x1' ? "toolbar__layouts__toggle--selected" : "toolbar__layouts__toggle"}
                onClick={() => onChangeLayout("1x1")}
              >
                {
                  layout === '1x1' ? <ViewStreamSharpIcon /> : <ViewStreamOutlinedIcon />
                }
              </IconButton>
              <IconButton
                color="inherit"
                className={layout === '2x2' ? "toolbar__layouts__toggle--selected" : "toolbar__layouts__toggle"}
                onClick={() => onChangeLayout("2x2")}
              >
                {
                  layout === '2x2' ? <GridViewSharpIcon /> : <GridViewOutlinedIcon />
                }
              </IconButton>
              <IconButton
                  color="inherit"
                  className={layout === '3x3' ? "toolbar__layouts__toggle--selected" : "toolbar__layouts__toggle"}
                  onClick={() => onChangeLayout("3x3")}
              >
                {
                  layout === '3x3' ? <ViewModuleSharpIcon /> : <ViewModuleOutlinedIcon />
                }
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>
      </>
    }

}