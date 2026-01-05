
import React from 'react';

export const TextCycleLoader = () => {
    return (
        <div className="spinnerContainer">
            <div className="spinner"></div>
            <div className="loader-text">
                <p>Loading</p>
                <div className="words">
                    <span className="word">tasks</span>
                    <span className="word">events</span>
                    <span className="word">media</span>
                    <span className="word">reports</span>
                    <span className="word">tasks</span>
                </div>
            </div>
        </div>
    );
};
