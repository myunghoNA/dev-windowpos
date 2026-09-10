import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Fade, Slide } from 'react-slideshow-image';

import fixBannerImg from '@renderer/assets/images/client-banner.jpg';
import '@renderer/assets/scss/App.scss';
import 'react-slideshow-image/dist/styles.css';

//Helper

const root = ReactDOM.createRoot(document.getElementById('did-root')!);
root.render(
    <React.StrictMode>
        <DidApp />
    </React.StrictMode>,
);

export default function DidApp(): JSX.Element {

    const defaultBanner = [
        {
          sort: 1,
          url: fixBannerImg,
          title: 'Demo',
        },
    ];

    const [ storeBanners ] = useState<any[]>(defaultBanner);

    const divStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundSize: 'cover',
        width: '100vw',
        height: '100vh',
    };


    return (
            <div className="slide-container">
            {
              storeBanners.length > 1 ?

                <Fade arrows={false} duration={5000}>
                {
                    storeBanners.map((element, index) => (
                        <div key={index}>
                            <div style={{ ...divStyle, 'backgroundImage': `url(${element.url})` }}>
                            </div>
                        </div>
                    ))
                } 
                </Fade>
              :  
                <Slide arrows={false} duration={5000}>
                {
                    storeBanners.map((element, index) => (
                        <div key={index}>
                            <div style={{ ...divStyle, 'backgroundImage': `url(${element.url})` }}></div>
                        </div>
                    ))
                } 
                </Slide>
            }
            </div>
         );
}