import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { leaveConference } from '../../../base/conference/actions.any';
import { isMobileBrowser } from '../../../base/environment/utils';
import { getLocalParticipant, isLocalParticipantModerator } from '../../../base/participants/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import { isReactionsButtonEnabled, shouldDisplayReactionsButtons } from '../../../reactions/functions.web';
import { isCCTabEnabled } from '../../../subtitles/functions.any';
import { isTranscribing } from '../../../transcribing/functions';
import {
    setHangupMenuVisible,
    setToolbarHovered,
    setToolboxVisible
} from '../../actions.web';
import {
    getJwtDisabledButtons,
    getVisibleButtons,
    getVisibleButtonsForReducedUI,
    isButtonEnabled,
    isToolboxVisible
} from '../../functions.web';
import { useKeyboardShortcuts, useToolboxButtons } from '../../hooks.web';
import { IToolboxButton } from '../../types';
import HangupButton from '../HangupButton';

import { EndConferenceButton } from './EndConferenceButton';
import HangupMenuButton from './HangupMenuButton';
import { LeaveConferenceButton } from './LeaveConferenceButton';
import Separator from './Separator';

/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
interface IProps {

    /**
     * Optional toolbar background color passed as a prop.
     */
    toolbarBackgroundColor?: string;

    /**
     * Explicitly passed array with the buttons which this Toolbox should display.
     */
    toolbarButtons?: Array<string>;
}

const useStyles = makeStyles()(() => {
    return {
        hangupMenu: {
            position: 'relative',
            right: 'auto',
            display: 'flex',
            flexDirection: 'column',
            rowGap: '8px',
            margin: 0,
            padding: '16px',
            marginBottom: '8px'
        },

        consultationRoot: {
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 260,
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 16px',
            pointerEvents: 'none'
        },

        consultationBar: {
            width: '100%',
            maxWidth: '1200px',
            background: 'rgba(0, 0, 0, 0.55)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            columnGap: '12px',
            pointerEvents: 'auto'
        },

        consultationGroup: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },

        consultationCenter: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center'
        },

        consultationHangup: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            padding: '0 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#d32f2f',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px'
        }
    };
});

/**
 * A component that renders the main toolbar.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
export default function Toolbox({
    toolbarButtons,
    toolbarBackgroundColor: toolbarBackgroundColorProp
}: IProps) {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const _toolboxRef = useRef<HTMLDivElement>(null);

    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const isNarrowLayout = useSelector((state: IReduxState) => state['features/base/responsive-ui'].isNarrowLayout);
    const videoSpaceWidth = useSelector((state: IReduxState) => state['features/base/responsive-ui'].videoSpaceWidth);
    const isModerator = useSelector(isLocalParticipantModerator);
    const customToolbarButtons = useSelector((state: IReduxState) => state['features/base/config'].customToolbarButtons);
    const iAmRecorder = useSelector((state: IReduxState) => state['features/base/config'].iAmRecorder);
    const iAmSipGateway = useSelector((state: IReduxState) => state['features/base/config'].iAmSipGateway);
    const overflowDrawer = useSelector((state: IReduxState) => state['features/toolbox'].overflowDrawer);
    const shiftUp = useSelector((state: IReduxState) => state['features/toolbox'].shiftUp);
    const hangupMenuVisible = useSelector((state: IReduxState) => state['features/toolbox'].hangupMenuVisible);
    const buttonsWithNotifyClick
        = useSelector((state: IReduxState) => state['features/toolbox'].buttonsWithNotifyClick);
    const reduxToolbarButtons = useSelector((state: IReduxState) => state['features/toolbox'].toolbarButtons);
    const toolbarButtonsToUse = toolbarButtons || reduxToolbarButtons;
    const isDialogVisible = useSelector((state: IReduxState) => Boolean(state['features/base/dialog'].component));
    const localParticipant = useSelector(getLocalParticipant);
    const transcribing = useSelector(isTranscribing);
    const _isCCTabEnabled = useSelector(isCCTabEnabled);
    // Read toolbar background color from config (if provided) or from props.
    const toolbarBackgroundColorFromConfig = useSelector((state: IReduxState) =>
        state['features/base/config'].toolbarConfig?.backgroundColor);
    const toolbarBackgroundColor = toolbarBackgroundColorProp || toolbarBackgroundColorFromConfig;
    // Do not convert to selector, it returns new array and will cause re-rendering of toolbox on every action.
    const jwtDisabledButtons = getJwtDisabledButtons(transcribing, _isCCTabEnabled, localParticipant?.features);

    const reactionsButtonEnabled = useSelector(isReactionsButtonEnabled);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const toolbarVisible = useSelector(isToolboxVisible);
    const mainToolbarButtonsThresholds
        = useSelector((state: IReduxState) => state['features/toolbox'].mainToolbarButtonsThresholds);
    const { reducedUImainToolbarButtons } = useSelector((state: IReduxState) => state['features/base/config']);
    const reducedUI = useSelector((state: IReduxState) => state['features/base/responsive-ui'].reducedUI);
    const alwaysVisible = useSelector((state: IReduxState) =>
        state['features/base/config'].toolbarConfig?.alwaysVisible);
    const allButtons = useToolboxButtons(customToolbarButtons);
    const isMobile = isMobileBrowser();
    const endConferenceSupported = Boolean(conference?.isEndConferenceSupported() && isModerator);

    useKeyboardShortcuts(toolbarButtonsToUse);

    useEffect(() => {
        if (!toolbarVisible) {
            if (document.activeElement instanceof HTMLElement
                && _toolboxRef.current?.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        }
    }, [ toolbarVisible ]);

    // Ensure toolbox stays visible when alwaysVisible is configured.
    // This useEffect handles both initial mount and when alwaysVisible changes.
    useEffect(() => {
        if (alwaysVisible && !toolbarVisible) {
            dispatch(setToolboxVisible(true));
        }
    }, [ toolbarVisible, alwaysVisible, dispatch ]);

    /**
     * Sets the visibility of the hangup menu.
     *
     * @param {boolean} visible - Whether or not the hangup menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetHangupVisible = useCallback((visible: boolean) => {
        dispatch(setHangupMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, [ dispatch ]);

    useEffect(() => {

        // On mobile web we want to keep both toolbox and hang up menu visible
        // because they depend on each other.
        if (endConferenceSupported && isMobile) {
            hangupMenuVisible && dispatch(setToolboxVisible(true));
        } else if (hangupMenuVisible && !toolbarVisible) {
            onSetHangupVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [ dispatch, hangupMenuVisible, toolbarVisible, onSetHangupVisible ]);

    /**
     * Key handler for overflow/hangup menus.
     *
     * @param {KeyboardEvent} e - Esc key click to close the popup.
     * @returns {void}
     */
    const onEscKey = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Escape') {
            e?.stopPropagation();
            hangupMenuVisible && dispatch(setHangupMenuVisible(false));
        }
    }, [ dispatch, hangupMenuVisible ]);

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    const onMouseOut = useCallback(() => {
        dispatch(setToolbarHovered(false));
    }, [ dispatch ]);

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    const onMouseOver = useCallback(() => {
        dispatch(setToolbarHovered(true));
    }, [ dispatch ]);

    /**
     * Handle focus on the toolbar.
     *
     * @returns {void}
     */
    const handleFocus = useCallback(() => {
        dispatch(setToolboxVisible(true));
    }, [ dispatch ]);

    /**
     * Handle blur the toolbar..
     *
     * @returns {void}
     */
    const handleBlur = useCallback(() => {
        if (!alwaysVisible) {
            dispatch(setToolboxVisible(false));
        }
    }, [ dispatch, alwaysVisible ]);

    if (iAmRecorder || iAmSipGateway) {
        return null;
    }

    const rootClassNames = `new-toolbox ${toolbarVisible ? 'visible' : ''} ${
        toolbarButtonsToUse.length ? '' : 'no-buttons'}`;

    const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
    const containerClassName = `toolbox-content${isMobile || isNarrowLayout ? ' toolbox-content-mobile' : ''}`;

    const normalUIButtons = getVisibleButtons({
        allButtons,
        buttonsWithNotifyClick,
        toolbarButtons: toolbarButtonsToUse,
        clientWidth: videoSpaceWidth,
        jwtDisabledButtons,
        mainToolbarButtonsThresholds
    });

    const reducedUIButtons = getVisibleButtonsForReducedUI({
        allButtons,
        buttonsWithNotifyClick,
        jwtDisabledButtons,
        reducedUImainToolbarButtons,
    });

    const mainMenuButtons = reducedUI
        ? reducedUIButtons.mainMenuButtons
        : normalUIButtons.mainMenuButtons;

    return (
        <div
            className = { cx(rootClassNames, shiftUp && 'shift-up') }
            id = 'new-toolbox'
            style = { toolbarBackgroundColor ? { backgroundColor: toolbarBackgroundColor } : undefined }>
            <div className = { containerClassName }>
                <div
                    className = 'toolbox-content-wrapper'
                    onBlur = { handleBlur }
                    onFocus = { handleFocus }
                    { ...(isMobile ? {} : {
                        onMouseOut,
                        onMouseOver
                    }) }>

                    <div
                        className = 'toolbox-content-items'
                        ref = { _toolboxRef }>
                        {mainMenuButtons.map(({ Content, key, ...rest }) => 
                            Content !== Separator && (key === 'microphone' || key === 'camera' || key === 'chat') && (
                                <Content
                                    { ...rest }
                                    buttonKey = { key }
                                    key = { key } />))}

                        {isButtonEnabled('hangup', toolbarButtonsToUse) && (
                            endConferenceSupported
                                ? <HangupMenuButton
                                    ariaControls = 'hangup-menu'
                                    isOpen = { hangupMenuVisible }
                                    key = 'hangup-menu'
                                    notifyMode = { buttonsWithNotifyClick?.get('hangup-menu') }
                                    onVisibilityChange = { onSetHangupVisible }>
                                    <ContextMenu
                                        accessibilityLabel = { t(toolbarAccLabel) }
                                        className = { classes.hangupMenu }
                                        hidden = { false }
                                        onKeyDown = { onEscKey }>
                                        <EndConferenceButton
                                            buttonKey = 'end-meeting'
                                            notifyMode = { buttonsWithNotifyClick?.get('end-meeting') } />
                                        <LeaveConferenceButton
                                            buttonKey = 'hangup'
                                            notifyMode = { buttonsWithNotifyClick?.get('hangup') } />
                                    </ContextMenu>
                                </HangupMenuButton>
                                : <HangupButton
                                    buttonKey = 'hangup'
                                    customClass = 'hangup-button'
                                    key = 'hangup-button'
                                    notifyMode = { buttonsWithNotifyClick.get('hangup') }
                                    visible = { isButtonEnabled('hangup', toolbarButtonsToUse) } />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
