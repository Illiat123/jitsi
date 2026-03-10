import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { getLobbyConfig } from '../../../../lobby/functions';
import { joinConference as joinConferenceAction } from '../../../../prejoin/actions.web';
import DeviceStatus from '../../../../prejoin/components/web/preview/DeviceStatus';
import { isRoomNameEnabled } from '../../../../prejoin/functions.web';
import Toolbox from '../../../../toolbox/components/web/Toolbox';
import { isButtonEnabled } from '../../../../toolbox/functions.web';
import { getConferenceName } from '../../../conference/functions';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';
import Tooltip from '../../../tooltip/components/Tooltip';
import { isPreCallTestEnabled } from '../../functions';

import ActionButton from './ActionButton';
import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';
import RecordingWarning from './RecordingWarning';
import UnsafeRoomWarning from './UnsafeRoomWarning';

interface IProps {

    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>;

    /**
     * Determine if pre call test is enabled.
     */
    _isPreCallTestEnabled?: boolean;

    /**
     * Function to join the conference.
     */
    joinConference?: Function;

    /**
     * The branding background of the premeeting screen(lobby/prejoin).
     */
    _premeetingBackground: string;

    /**
     * The name of the meeting that is about to be joined.
     */
    _roomName: string;

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: ReactNode;

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string;

    /**
     * The name of the participant.
     */
    name?: string;

    /**
     * Indicates whether the copy url button should be shown.
     */
    showCopyUrlButton?: boolean;

    /**
     * Indicates whether the device status should be shown.
     */
    showDeviceStatus: boolean;

    /**
     * Indicates whether to display the recording warning.
     */
    showRecordingWarning?: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning?: boolean;

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
    skipPrejoinButton?: ReactNode;

    /**
     * Whether it's used in the 3rdParty prejoin screen or not.
     */
    thirdParty?: boolean;

    /**
     * Title of the screen.
     */
    title?: string;

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean;

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            position: 'absolute',
            inset: '0 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.preMeetingBackground,
            zIndex: 252,
            justifyContent: 'space-between'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 30px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white'
        },
        title: {
            ...theme.typography.heading4,
            color: theme.palette.prejoinTitleText,
            margin: 0,
            textAlign: 'center',
            flex: 1,

            '@media (max-width: 400px)': {
                fontSize: '18px'
            }
        },
        centerContent: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '40px 20px',
            overflow: 'auto'
        },
        previewWrapper: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '20%',
            maxWidth: '50vw',
            maxHeight: '25vh',
            boxSizing: 'border-box',
            marginBottom: '30px',
            borderRadius: '8px',
            overflow: 'hidden'
        },
        descriptionText: {
            color: theme.palette.prejoinTitleText || '#fff',
            textAlign: 'center',
            marginTop: '20px',
            marginBottom: '30px',
            fontSize: '14px',
            lineHeight: '1.5',
            maxWidth: '600px',
            padding: '0 20px'
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
            padding: '16px 24px',
            position: 'relative',
            width: '100%',
            zIndex: 252,
            backgroundColor: theme.palette.preMeetingBackground
        },
        contentControls: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '15px',
            flexWrap: 'wrap'
        },
        paddedContent: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 20px',

            '& > *': {
                width: '100%',
                boxSizing: 'border-box'
            }
        },
        roomNameContainer: {
            width: '100%',
            textAlign: 'center',
            marginBottom: theme.spacing(1)
        },

        roomName: {
            ...theme.typography.heading5,
            color: theme.palette.prejoinRoomNameText,
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
        },
        footer: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px 30px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            gap: '20px'
        },
        joinButtonContainer: {
            display: 'flex',
            justifyContent: 'center',
            flex: '0 1 auto',
            minWidth: 'auto'
        }
    };
});

const PreMeetingScreen = ({
    _buttons,
    _isPreCallTestEnabled,
    _premeetingBackground,
    _roomName,
    children,
    className,
    joinConference,
    showDeviceStatus,
    showRecordingWarning,
    showUnsafeRoomWarning,
    skipPrejoinButton,
    title,
    videoMuted,
    videoTrack
}: IProps) => {
    const { classes } = useStyles();
    const style = _premeetingBackground ? {
        background: _premeetingBackground,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    } : {};

    const roomNameRef = useRef<HTMLSpanElement | null>(null);
    const [ isOverflowing, setIsOverflowing ] = useState(false);

    useEffect(() => {
        if (roomNameRef.current) {
            const element = roomNameRef.current;
            const elementStyles = window.getComputedStyle(element);
            const elementWidth = Math.floor(parseFloat(elementStyles.width));

            setIsOverflowing(element.scrollWidth > elementWidth + 1);
        }
    }, [ _roomName ]);

    return (
        <div className = { clsx('premeeting-screen', classes.container, className) }>
            <div className = { classes.header }>
                <h1 className = { classes.title }>
                    {title && title}
                </h1>
            </div>
            
            <div className = { classes.centerContent }>
                <div className = { classes.previewWrapper }>
                    <Preview
                        videoMuted = { videoMuted }
                        videoTrack = { videoTrack } />
                </div>
                <p className = { classes.descriptionText }>
                    Sie sind bereit, der Konferenz beizutreten. Falls Sie wünschen, können Sie sich mit Hilfe der unterliengenden Schaltflächen stummschalten und / oder Ihre Kamera deaktivieren.
                </p>
            </div>

            <div className = { classes.footer }>
                <div style = {{ display: 'flex', flexDirection: 'row', gap: '15px', alignItems: 'center', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <div className = { classes.joinButtonContainer }>
                        <ActionButton
                            onClick = { joinConference }
                            testId = 'prejoin.joinMeeting'
                            type = 'primary'>
                            Beitreten
                        </ActionButton>
                    </div>
                    <div className = { classes.contentControls }>
                        {_isPreCallTestEnabled && <ConnectionStatus />}
                        {_buttons.length && <Toolbox toolbarButtons = { _buttons } />}
                        {showRecordingWarning && <RecordingWarning />}
                        {showUnsafeRoomWarning && <UnsafeRoomWarning />}
                    </div>
                </div>
            </div>
        </div>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { hiddenPremeetingButtons, prejoinConfig } = state['features/base/config'];
    const { toolbarButtons } = state['features/toolbox'];
    const { knocking } = state['features/lobby'];
    const { showHangUp: showHangUpLobby = true } = getLobbyConfig(state);
    const { showHangUp: showHangUpPrejoin = true } = prejoinConfig || {};
    const premeetingButtons = (ownProps.thirdParty
        ? THIRD_PARTY_PREJOIN_BUTTONS
        : PREMEETING_BUTTONS).filter((b: any) => !(hiddenPremeetingButtons || []).includes(b))
        //.filter((b: any) => b !== 'invite');

    const shouldShowHangUp = knocking ? showHangUpLobby : showHangUpPrejoin;

    //if (shouldShowHangUp && !premeetingButtons.includes('hangup')) {
    //    premeetingButtons.push('hangup');
    //}

    const { premeetingBackground } = state['features/dynamic-branding'];

    return {
        // For keeping backwards compat.: if we pass an empty hiddenPremeetingButtons
        // array through external api, we have all prejoin buttons present on premeeting
        // screen regardless of passed values into toolbarButtons config overwrite.
        // If hiddenPremeetingButtons is missing, we hide the buttons according to
        // toolbarButtons config overwrite.
        _buttons: hiddenPremeetingButtons
            ? premeetingButtons
            : premeetingButtons.filter(b => isButtonEnabled(b, toolbarButtons)),
        _isPreCallTestEnabled: isPreCallTestEnabled(state),
        _premeetingBackground: premeetingBackground,
        _roomName: isRoomNameEnabled(state) ? getConferenceName(state) : ''
    };
}

const mapDispatchToProps = {
    joinConference: joinConferenceAction
};

export default connect(mapStateToProps, mapDispatchToProps)(PreMeetingScreen);

