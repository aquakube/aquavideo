import React from 'react';
import CircleIcon from '@mui/icons-material/Circle';
import Tooltip from '@mui/material/Tooltip';

function pingStatus(metric) {
    if (metric === 1) {
        return 'Online'
    } else if( metric === 0) {
        return 'Offline'
    }

    return 'Unknown'
}

function pingColor(metric) {
    if (metric === 1) {
        return '#1cd2a0'
    } else if( metric === 0) {
        return '#d9534f'
    }

    return '#aaa'
}


export default function PingIcon({ metric }) {
    return (
        <Tooltip title={pingStatus(metric)} arrow>
            <CircleIcon
                style={{
                    fontSize: 15,
                    color: pingColor(metric)
                }}
            />
        </Tooltip>
    )
}