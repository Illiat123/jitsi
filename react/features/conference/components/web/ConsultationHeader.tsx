import React from 'react';
import { makeStyles } from 'tss-react/mui';

import ConferenceTimer from '../ConferenceTimer';

const useStyles = makeStyles()(theme => {
    return {
        root: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 251,
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 16px',
            pointerEvents: 'none'
        },

        bar: {
            width: '100%',
            maxWidth: '1200px',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
        },

        title: {
            ...theme.typography.bodyShortBold,
            color: theme.palette.text01,
            margin: 0
        },

        timer: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.text03,
            margin: 0
        }
    };
});

export default function ConsultationHeader() {
    const { classes } = useStyles();

    return (
        <div className = { classes.root }>
            <div className = { classes.bar }>
                <p className = { classes.title }>Video-Beratung (online)</p>
                <div className = { classes.timer }><ConferenceTimer /></div>
            </div>
        </div>
    );
}

