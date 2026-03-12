import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { connect, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { leaveConference } from '../../../base/conference/actions.any';
import Platform from '../../../base/react/Platform.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { iAmVisitor } from '../../../visitors/functions';
import { customButtonPressed } from '../../actions.native';
import { getVisibleNativeButtons, isToolboxVisible } from '../../functions.native';
import { useNativeToolboxButtons } from '../../hooks.native';
import { IToolboxNativeButton } from '../../types';

import styles from './styles';

/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
interface IProps {

    /**
     * Whether we are in visitors mode.
     */
    _iAmVisitor: boolean;

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: any;

    /**
     * The indicator which determines whether the toolbox is visible.
     */
    _visible: boolean;

    /**
     * Redux store dispatch method.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Implements the conference Toolbox on React Native.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}
 */
function Toolbox(props: IProps) {
    const {
        _iAmVisitor,
        _styles,
        _visible,
        dispatch
    } = props;

    if (!_visible) {
        return null;
    }

    const { clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const { customToolbarButtons } = useSelector((state: IReduxState) => state['features/base/config']);
    const toolbarBackgroundColor = useSelector((state: IReduxState) => state['features/base/config'].toolbarConfig?.backgroundColor);
    const {
        mainToolbarButtonsThresholds,
        toolbarButtons
    } = useSelector((state: IReduxState) => state['features/toolbox']);

    const allButtons = useNativeToolboxButtons(customToolbarButtons);

    const { mainMenuButtons } = getVisibleNativeButtons({
        allButtons,
        clientWidth,
        iAmVisitor: _iAmVisitor,
        mainToolbarButtonsThresholds,
        toolbarButtons
    });

    const bottomEdge = Platform.OS === 'ios' && _visible;
    const { buttonStylesBorderless, hangupButtonStyles } = _styles;
    const style = { ...styles.toolbox };

    // Allow overriding the toolbox background color from config (configOverwrite/overwriteConfig).
    if (toolbarBackgroundColor) {
        style.backgroundColor = toolbarBackgroundColor as any;
    }

    // We have only hangup and raisehand button in _iAmVisitor mode
    if (_iAmVisitor) {
        style.justifyContent = 'center';
    }

    const renderToolboxButtons = () => {
        if (!mainMenuButtons?.length) {
            return;
        }

        const keep = new Set([ 'microphone', 'camera', 'desktop', 'chat' ]);
        const filtered = mainMenuButtons.filter(b => keep.has(b.key));

        const renderButton = ({ Content, key, text, ...rest }: IToolboxNativeButton) => (
            <Content
                { ...rest }
                /* eslint-disable react/jsx-no-bind */
                handleClick = { () => dispatch(customButtonPressed(key, text)) }
                isToolboxButton = { true }
                key = { key }
                styles = { buttonStylesBorderless } />
        );

        return (
            <>
                {filtered.filter(b => b.key === 'microphone' || b.key === 'camera').map(renderButton)}

                <Button
                    accessibilityLabel = 'consultation.leave'
                    label = 'Verlassen'
                    onClick = { () => dispatch(leaveConference() as any) }
                    type = { BUTTON_TYPES.DESTRUCTIVE }
                    wrapperStyle = {{ marginHorizontal: 8, height: 36, justifyContent: 'center' }} />

                {filtered.filter(b => b.key === 'desktop' || b.key === 'chat').map(renderButton)}
            </>
        );
    };

    return (
        <View
            style = { styles.toolboxContainer as ViewStyle }>
            <SafeAreaView
                accessibilityRole = 'toolbar'
                edges = { [ bottomEdge && 'bottom' ].filter(Boolean) as Edge[] }
                pointerEvents = 'box-none'
                style = { style as ViewStyle }>
                { renderToolboxButtons() }
            </SafeAreaView>
        </View>
    );
}

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Toolbox} props.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _iAmVisitor: iAmVisitor(state),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state),
    };
}

export default connect(_mapStateToProps)(Toolbox);
