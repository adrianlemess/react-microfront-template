import React from 'react';
import ReactDOM from 'react-dom';
import AppContainer from './containers/AppContainer';

const idSelector = process.env.ENTRY_POINT_ID;

const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const buildApplication = () => <AppContainer />;

const serverSideApplication = pipe(
    buildApplication,
    application => ({
        application: React.createElement(
            'div', {
                id: idSelector
            },
            application
        )
    })
);

const clientSideApplication = pipe(
    buildApplication,
    application => ReactDOM.hydrate(
        application,
        // @todo pass name
        document.getElementById(idSelector)
    )
);

if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        console.log('document', document);
        const rootEle = document.getElementById(idSelector);

        console.log('rootEle', rootEle);
        const ENTRY_POINT = document.querySelector(`#${idSelector}`);

        console.log('ENTRY_POINT', ENTRY_POINT);

        if (rootEle && rootEle.hasChildNodes) {
            clientSideApplication();
        } else if (rootEle) {
            ReactDOM.render(buildApplication(), ENTRY_POINT);
        }
    });
}

export {
    // eslint-disable-next-line import/prefer-default-export
    serverSideApplication
};
