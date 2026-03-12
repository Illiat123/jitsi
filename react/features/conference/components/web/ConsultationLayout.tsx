import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import LargeVideo from '../../../large-video/components/LargeVideo.web';
import { toggleToolboxVisible } from '../../../toolbox/actions.any';
import Toolbox from '../../../toolbox/components/web/Toolbox';
import MainFilmstrip from '../../../filmstrip/components/web/MainFilmstrip';
import ScreenshareFilmstrip from '../../../filmstrip/components/web/ScreenshareFilmstrip';
import StageFilmstrip from '../../../filmstrip/components/web/StageFilmstrip';

import ConsultationHeader from './ConsultationHeader';
import { default as Notice } from './Notice';

/**
 * ConsultationLayout
 *
 * New default in-conference layout for the web client. It composes the
 * consultation header, main video area and minimal toolbox strip while
 * reusing the existing media components.
 */
const ConsultationLayout = () => {
    const { t } = useTranslation();
    const dispatch: IStore['dispatch'] = useDispatch();

    const onVideospaceTouchStart = () => {
        dispatch(toggleToolboxVisible());
    };

    return (
        <div className = 'consultation-layout'>
            <ConsultationHeader />
            <Notice />

            <div
                className = 'consultation-layout__videospace'
                id = 'videospace'
                onTouchStart = { onVideospaceTouchStart }>
                <LargeVideo />
                <StageFilmstrip />
                <ScreenshareFilmstrip />
                <MainFilmstrip />
            </div>

            <span
                aria-level = { 1 }
                className = 'sr-only'
                role = 'heading'>
                { t('toolbar.accessibilityLabel.heading') }
            </span>

            {
                // Keep using the existing consultation-styled toolbox strip.
                !isMobileBrowser() && <Toolbox />
            }
        </div>
    );
};

export default ConsultationLayout;

