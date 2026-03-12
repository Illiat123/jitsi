import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BackHandler,
    Platform,
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { setPermanentProperty } from '../../../analytics/actions';
import { appNavigate } from '../../../app/actions.native';
import { IReduxState } from '../../../app/types';
import { setAudioOnly } from '../../../base/audio-only/actions';
import { getConferenceName } from '../../../base/conference/functions';
import { isNameReadOnly } from '../../../base/config/functions.any';
import { connect } from '../../../base/connection/actions.native';
import { PREJOIN_PAGE_HIDE_DISPLAY_NAME } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { IconCloseLarge } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getFieldValue } from '../../../base/react/functions';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui/constants';
import { updateSettings } from '../../../base/settings/actions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { openDisplayNamePrompt } from '../../../display-name/actions';
import BrandingImageBackground from '../../../dynamic-branding/components/native/BrandingImageBackground';
import LargeVideo from '../../../large-video/components/LargeVideo.native';
import { getLobbyConfig } from '../../../lobby/functions';
import HeaderNavigationButton from '../../../mobile/navigation/components/HeaderNavigationButton';
import { navigateRoot } from '../../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import HangupButton from '../../../toolbox/components/HangupButton';
import AudioMuteButton from '../../../toolbox/components/native/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/native/VideoMuteButton';
import { isDisplayNameRequired, isRoomNameEnabled } from '../../functions.native';
import { IPrejoinProps } from '../../types';
import { hasDisplayName } from '../../utils';

import { preJoinStyles as styles } from './styles';


const Prejoin: React.FC<IPrejoinProps> = ({ navigation }: IPrejoinProps) => {
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const { t } = useTranslation();
    const { aspectRatio, clientHeight, clientWidth } = useSelector(
        (state: IReduxState) => state['features/base/responsive-ui']
    );
    const isTablet = Math.min(clientWidth, clientHeight) >= 768;
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const isDisplayNameMandatory = useSelector((state: IReduxState) => isDisplayNameRequired(state));
    const isDisplayNameVisible
        = useSelector((state: IReduxState) => !getFeatureFlag(state, PREJOIN_PAGE_HIDE_DISPLAY_NAME, false));
    const isDisplayNameReadonly = useSelector(isNameReadOnly);
    const roomName = useSelector((state: IReduxState) => getConferenceName(state));
    const roomNameEnabled = useSelector((state: IReduxState) => isRoomNameEnabled(state));
    const { showHangUp: showHangUpLobby = true } = useSelector((state: IReduxState) => getLobbyConfig(state));
    const { showHangUp: showHangUpPrejoin = true } = useSelector((state: IReduxState) => state['features/base/config'].prejoinConfig || {});
    const { knocking } = useSelector((state: IReduxState) => state['features/lobby']);
    const participantName = localParticipant?.name;
    const [ displayName, setDisplayName ]
        = useState(participantName || '');
    const isDisplayNameMissing = useMemo(
        () => !displayName && isDisplayNameMandatory, [ displayName, isDisplayNameMandatory ]);
    const showDisplayNameError = useMemo(
        () => !isDisplayNameReadonly && isDisplayNameMissing && isDisplayNameVisible,
        [ isDisplayNameMissing, isDisplayNameReadonly, isDisplayNameVisible ]);
    const showDisplayNameInput = useMemo(
        () => isDisplayNameVisible && (displayName || !isDisplayNameReadonly),
        [ displayName, isDisplayNameReadonly, isDisplayNameVisible ]);
    const onChangeDisplayName = useCallback(event => {
        const fieldValue = getFieldValue(event);

        setDisplayName(fieldValue);
        dispatch(updateSettings({
            displayName: fieldValue
        }));
    }, [ displayName ]);

    const onJoin = useCallback(() => {
        dispatch(connect());
        navigateRoot(screen.conference.root);
    }, [ dispatch ]);

    const maybeJoin = useCallback(() => {
        if (isDisplayNameMissing) {
            dispatch(openDisplayNamePrompt({
                onPostSubmit: onJoin,
                validateInput: hasDisplayName
            }));
        } else {
            onJoin();
        }
    }, [ dispatch, hasDisplayName, isDisplayNameMissing, onJoin ]);

    const onJoinLowBandwidth = useCallback(() => {
        dispatch(setAudioOnly(true));
        maybeJoin();
    }, [ dispatch ]);

    const goBack = useCallback(() => {
        dispatch(appNavigate(undefined));

        return true;
    }, [ dispatch ]);

    const { PRIMARY, TERTIARY } = BUTTON_TYPES;

    useEffect(() => {
        const hardwareBackPressSubscription = BackHandler.addEventListener('hardwareBackPress', goBack);

        dispatch(setPermanentProperty({
            wasPrejoinDisplayed: true
        }));

        return () => hardwareBackPressSubscription.remove();
    }, []); // dispatch is not in the dependency list because we want the action to be dispatched only once when
    // the component is mounted.

    const headerLeft = () => {
        if (Platform.OS === 'ios') {
            return (
                <HeaderNavigationButton
                    label = { t('dialog.close') }
                    onPress = { goBack } />
            );
        }

        return (
            <HeaderNavigationButton
                onPress = { goBack }
                src = { IconCloseLarge } />
        );
    };

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [ navigation ]);

    let contentContainerStyles = styles.contentContainer;
    let largeVideoContainerStyles = styles.largeVideoContainer;

    if (isTablet && aspectRatio === ASPECT_RATIO_WIDE) {
        // @ts-ignore
        contentContainerStyles = styles.contentContainerWide;
        largeVideoContainerStyles = styles.largeVideoContainerWide;
    }

    return (
        <JitsiScreen
            addBottomPadding = { false }
            safeAreaInsets = { [ 'right' ] }
            style = { styles.consultationWrapper as ViewStyle }>
            <View style = { styles.consultationTopBar as ViewStyle }>
                <Text style = { styles.consultationTitle as TextStyle }>
                    Video-Beratung (ready)
                </Text>
            </View>

            <View style = { styles.consultationCenter as ViewStyle }>
                {isFocused && (
                    <View style = { styles.consultationPreview as ViewStyle }>
                        <LargeVideo />
                    </View>
                )}
                <Text style = { styles.consultationInstruction as TextStyle }>
                    Sie sind bereit, der Konferenz beizutreten. Falls Sie wünschen, können Sie sich mit Hilfe der unterliegenden Schaltflächen stummschalten und / oder Ihre Kamera deaktivieren.
                </Text>
            </View>

            <View style = { styles.consultationBottom as ViewStyle }>
                <View style = { styles.toolboxContainer as ViewStyle }>
                    <AudioMuteButton styles = { styles.buttonStylesBorderless } />
                    <VideoMuteButton styles = { styles.buttonStylesBorderless } />
                    {(knocking ? showHangUpLobby : showHangUpPrejoin) && (
                        <HangupButton styles = { styles.buttonStylesBorderless } />
                    )}
                </View>

                <Button
                    accessibilityLabel = 'prejoin.joinMeeting'
                    disabled = { showDisplayNameError }
                    labelKey = 'prejoin.joinMeeting'
                    onClick = { maybeJoin }
                    style = { styles.joinButton }
                    type = { PRIMARY } />
            </View>
        </JitsiScreen>
    );
};

export default Prejoin;
