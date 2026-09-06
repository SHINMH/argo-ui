import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import * as React from 'react';

import {SlidingPanel} from '../sliding-panel/sliding-panel';
import {PopupManager} from './popup-manager';
import {Popup, PopupProps} from './popup';

const TestPopup = ({onResult}: {onResult: (result: unknown) => void}) => {
    const [isPanelShown, setPanelShown] = React.useState(true);
    const [popupProps, setPopupProps] = React.useState<PopupProps | null>(null);
    const [popupManager] = React.useState(() => new PopupManager());

    React.useEffect(() => {
        const subscription = popupManager.popupProps.subscribe(setPopupProps);
        return () => subscription.unsubscribe();
    }, [popupManager]);

    return (
        <>
            <SlidingPanel isShown={isPanelShown} onClose={() => setPanelShown(false)}>
                <button onClick={() => popupManager.prompt('Delete resource', () => <textarea aria-label='Resource name' />).then(onResult)}>Delete</button>
            </SlidingPanel>
            {popupProps && <Popup {...popupProps} />}
        </>
    );
};

test('dismisses a popup before its sliding panel', async () => {
    const onResult = jest.fn();
    render(<TestPopup onResult={onResult} />);

    const trigger = screen.getByRole('button', {name: 'Delete'});
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', {name: 'Delete resource'});
    trigger.focus();

    fireEvent.keyDown(trigger, {key: 'Escape', keyCode: 27});
    expect(dialog).toHaveFocus();
    expect(document.querySelector('.sliding-panel')).toHaveClass('sliding-panel--opened');

    fireEvent.keyDown(dialog, {key: 'Escape', keyCode: 27});
    expect(dialog).not.toBeInTheDocument();
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(null));
    const panelBody = document.querySelector<HTMLElement>('.sliding-panel__body');
    expect(panelBody).toHaveFocus();
    expect(document.querySelector('.sliding-panel')).toHaveClass('sliding-panel--opened');

    fireEvent.keyDown(panelBody!, {key: 'Escape', keyCode: 27});
    expect(document.querySelector('.sliding-panel')).not.toHaveClass('sliding-panel--opened');
});
