import { useState } from 'react';

function RoomLobby({ playerName, onRoomReady }) {
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async (url, body) => {
        setError('');
        setIsSubmitting(true);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const responseText = await response.text();
            let data;
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = responseText;
            }
            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : 'Could not enter the room.');
            }
            onRoomReady(data);
        } catch (requestError) {
            console.error('Room request failed:', requestError);
            setError(requestError.message || 'Could not enter the room. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="panel room-lobby">
            <div className="panel-heading">
                <div>
                    <h2>Play with a friend</h2>
                    <p>Create a room and share its code, or join a room your friend created.</p>
                </div>
            </div>

            {error && <p className="game-error" role="alert">{error}</p>}

            <div className="room-lobby__options">
                <div className="room-lobby__option">
                    <h3>Create a room</h3>
                    <p>You will choose the card.</p>
                    <button
                        type="button"
                        className="primary-button"
                        disabled={isSubmitting}
                        onClick={() => submit('/api/rooms', { playerName })}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Room'}
                    </button>
                </div>

                <form
                    className="room-lobby__option"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const code = roomCode.trim().toUpperCase();
                        if (code) {
                            submit(`/api/rooms/${encodeURIComponent(code)}/join`, { playerName });
                        }
                    }}
                >
                    <h3>Join a room</h3>
                    <p>Enter the six-character code from your friend.</p>
                    <div className="room-lobby__join">
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(event) => setRoomCode(event.target.value.toUpperCase().slice(0, 6))}
                            placeholder="ROOM CODE"
                            aria-label="Room code"
                            maxLength={6}
                            required
                        />
                        <button type="submit" className="primary-button" disabled={isSubmitting || roomCode.trim().length !== 6}>
                            Join
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default RoomLobby;
