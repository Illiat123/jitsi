import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getConferenceName } from '../../../base/conference/functions';
import Tooltip from '../../../base/tooltip/components/Tooltip';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            ...theme.typography.bodyLongRegular,
            color: theme.palette.conferenceSubjectText,
            padding: '2px 16px',
            backgroundColor: 'transparent',
            maxWidth: '324px',
            boxSizing: 'border-box',
            height: '28px',
            borderRadius: '0',
            marginLeft: '2px',

            '@media (max-width: 300px)': {
                display: 'none'
            }
        },
        content: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    };
});

/**
 * Label for the conference name.
 *
 * @returns {ReactElement}
 */
const SubjectText = () => {
    const subject = useSelector(getConferenceName);
    const { classes } = useStyles();

    return (
        <Tooltip
            content = { subject }
            position = 'bottom'>
            <div className = { classes.container }>
                <div className = { clsx('subject-text--content', classes.content) }>{subject}</div>
            </div>
        </Tooltip>
    );
};

export default SubjectText;
