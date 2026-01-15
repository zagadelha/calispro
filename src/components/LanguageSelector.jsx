import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({ floating = false }) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className={floating ? 'language-selector-floating' : 'language-selector'}>
            <button
                onClick={() => changeLanguage('pt')}
                className={i18n.language.startsWith('pt') ? 'active' : ''}
                aria-label="Português"
            >
                PT
            </button>
            <button
                onClick={() => changeLanguage('en')}
                className={i18n.language.startsWith('en') ? 'active' : ''}
                aria-label="English"
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('es')}
                className={i18n.language.startsWith('es') ? 'active' : ''}
                aria-label="Español"
            >
                ES
            </button>
        </div>
    );
};

export default LanguageSelector;
