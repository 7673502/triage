import { useState } from 'react';
import './MultiIdInput.css';

interface Props {
  ids: string[];
  onChange: (next: string[]) => void;
}

export default function MultiIdInput({ ids, onChange }: Props) {
  const [input, setInput] = useState('');

  const addId = () => {
    const trimmed = input.trim();
    if (trimmed && !ids.includes(trimmed)) {
      onChange([...ids, trimmed]);
    }
    setInput('');
  };

  const removeId = (id: string) => {
    onChange(ids.filter((x) => x !== id));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addId();
    }
  };

  return (
    <div className="multi-id-input">
      <div className="badges">
        {ids.map((id) => (
          <span className="badge" key={id}>
            {id}
            <button onClick={() => removeId(id)}>&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add ID and hit space or enter"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
      />
    </div>
  );
}
