import React from 'react';

import { Drawer } from '@mui/material';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import { Divider } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import ListSubheader from '@mui/material/ListSubheader';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import Tooltip from '@mui/material/Tooltip';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import PingIcon from './PingIcon';

function getFilteredList(cameraMap, cameraMetrics, groupFilters, onlineFilter) {
    return Object.keys(cameraMap)
        .filter(cameraName => {
            const camera = cameraMap[cameraName];
            return groupFilters.every(filter => camera.groups.includes(filter));
        })
        .filter(cameraName => {
            const metrics = cameraMetrics[cameraName];
            return onlineFilter ? metrics?.ping === 1 : true;
        })
        .sort();
}

export default class AppDrawer extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            groupFilters: [],
            onlineFilter: false,
            filteredCameraList: [],
        };

        this.handleFilter = this.handleFilter.bind(this);
    }

    componentDidMount() {
        const { groupFilters, onlineFilter } = this.props;

        this.handleFilter(groupFilters, onlineFilter);
    }

    componentDidUpdate(prevProps, prevState) {
        const { cameraMap, cameraMetrics } = this.props;
        const { groupFilters, onlineFilter } = this.state;

        if (prevProps.cameraMap !== cameraMap 
            || prevProps.cameraMetrics !== cameraMetrics
            || prevState.groupFilters !== groupFilters
            || prevState.onlineFilter !== onlineFilter) {
            const filteredCameraList = getFilteredList(cameraMap, cameraMetrics, groupFilters, onlineFilter);
            this.setState({ filteredCameraList });
        }
    }

    handleFilter(groupFilters, onlineFilter) {
        const { cameraMetrics, cameraMap } = this.props;
    
        groupFilters = typeof filters === 'string' ? groupFilters.split(',') : groupFilters;
        
        const filteredCameraList = getFilteredList(cameraMap, cameraMetrics, groupFilters, onlineFilter);
        
        this.setState({ groupFilters, filteredCameraList, onlineFilter }, () => {
            this.props.onUpdateFilters({ groupFilters, onlineFilter });
        });
    }

    renderCameraList() {
        const { cameraMetrics, cameraMap, selectedCameras } = this.props;
        const { filteredCameraList } = this.state;
    
        return (
            <Box sx={{ overflow: 'auto', flex: 1 }}>
                <List sx={{ padding: '0' }}>
                    {filteredCameraList.map((cameraName, index) => (
                        <div key={cameraName}>
                            <ListItem sx={{ padding: '0' }}>
                                <ListItemButton
                                    sx={{ padding: '10px' }}
                                    role={undefined}
                                    onClick={() => this.props.handleCameraToggle(cameraName)}
                                    dense
                                    disableRipple
                                >
                                    <div className='drawer__selection'>
                                        <div className='drawer__selection__status'>
                                            <PingIcon metric={cameraMetrics[cameraName]?.ping} />
                                            <div className='drawer__selection__status__labels'>
                                                {cameraMap[cameraName]?.groups.map((group, index) => (
                                                    <Chip label={group} key={index} size="small" style={{borderRadius: 8}} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className='drawer__selection__title'>
                                            {
                                                selectedCameras.indexOf(cameraName) > -1  ? 
                                                    <CheckBoxIcon color="primary" style={{ fontSize: 15 }}/> :
                                                    <CheckBoxOutlineBlankIcon color="primary" style={{ fontSize: 15 }}/>
                                            }
                                            <Typography variant="button">
                                                {cameraMap[cameraName]?.title || cameraName}
                                            </Typography>
                                        </div>
                                    </div>
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                        </div>
                    ))}
                </List>
            </Box>
        );
    }

    renderFilterMenu() {
        const { cameraGroupings, drawerWidth } = this.props;
        const { groupFilters } = this.state;
    
        const listItems = [];
    
        cameraGroupings?.groupTypes?.forEach(groupType => {
            listItems.push(<ListSubheader key={groupType.title}>{groupType.title}</ListSubheader>);
            listItems.push(...groupType.groups.map(group => (
                <MenuItem
                    key={group}
                    value={group}
                >
                    {group}
                </MenuItem>
            )));
        });
    
        return (
            <div className='drawer__form'>
                <Tooltip title={this.state.onlineFilter ? "Show Offline Cameras" : "Hide Offline Cameras"} arrow>
                    <Checkbox
                        icon={<VideocamIcon />}
                        checkedIcon={<VideocamOffIcon />}
                        checked={this.state.onlineFilter}
                        onChange={(e) => this.handleFilter(this.state.groupFilters, e.target.checked)}
                    />
                </Tooltip>
        
                <FormControl sx={{ m: 1, width: '95%' }}>
                    <InputLabel>Filter By Group</InputLabel>
                    <Select
                        multiple
                        value={groupFilters}
                        onChange={(e) => this.handleFilter(e.target.value, this.state.onlineFilter)}
                        input={<OutlinedInput label="Filter by group" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={value} />
                                ))}
                            </Box>
                        )}
                        MenuProps={{
                            PaperProps: {
                                style: {
                                    maxHeight: 48 * 4.5 + 8,
                                    width: drawerWidth - 150,
                                },
                            }
                        }}
                    >
                        {listItems}
                    </Select>
                </FormControl>
            </div>
        )
    }

    render() {
        const { drawerOpen, drawerWidth } = this.props;

        return (
            <Drawer
                variant="persistent"
                open={drawerOpen}
                sx={{
                    minWidth: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar variant="dense" />
                {this.renderFilterMenu()}
                <Divider/>
                {this.renderCameraList()}
            </Drawer>
        )
    }

}