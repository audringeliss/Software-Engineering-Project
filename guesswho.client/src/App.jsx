import { useEffect, useState } from 'react';

function App() {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        fetch('https://localhost:7087/api/cards')
            .then(response => response.json())
            .then(data => {
                console.log('Gauti duomenys:', data);
                if (Array.isArray(data)) {
                    setCards(data);
                }
            })
            .catch(error => console.error('Tinklo klaida:', error));
    }, []);

    return (
        <div style={{
            padding: '30px',
            fontFamily: 'Segoe UI, sans-serif',
            backgroundColor: '#121212',
            color: '#ffffff',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ marginBottom: '50px' }}>Guess Who? Game Board</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px',
                maxWidth: '1000px',
                margin: '0 auto'
            }}>
                {cards.map((card, index) => {
                    const name = card.name || card.Name || 'Be pavadinimo';
                    const category = card.category || card.Category || 'Bendras';
                    const attributes = card.attributes || card.Attributes || [];
                    const isFlipped = card.isFlipped ?? card.IsFlipped ?? false;

                    return (
                        <div key={card.id || card.Id || index} style={{
                            border: '2px solid #007bff',
                            borderRadius: '12px',
                            padding: '20px',
                            backgroundColor: isFlipped ? '#222' : '#1e1e24',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            textAlign: 'left'
                        }}>
                            <h2 style={{ marginTop: 0, color: '#4da6ff' }}>{name}</h2>
                            <p style={{ margin: '5px 0', fontSize: '14px', color: '#ccc' }}>
                                <strong>Category:</strong> {category}
                            </p>
                            <hr style={{ borderColor: '#333', margin: '10px 0' }} />
                            <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>Attributes:</p>
                            <ul style={{ paddingLeft: '20px', margin: '5px 0 0 0', fontSize: '13px', color: '#bbb' }}>
                                {Array.isArray(attributes) && attributes.map((attr, i) => (
                                    <li key={i}>{String(attr)}</li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default App;