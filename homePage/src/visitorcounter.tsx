import { useState, useEffect } from 'react';

const VisitorCounter = () => {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const incrementCount = async () => {
      try {
        const response = await fetch('YOUR_LAMBDA_API_ENDPOINT', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: 'visitors', // This is the ID we'll use in DynamoDB
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to increment counter');
        }

        const data = await response.json();
        setCount(data.counter);
      } catch (err) {
        setError('Failed to load visitor count');
        console.error(err);
      }
    };

    incrementCount();
  }, []); // Run once when component mounts

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      Visitors: {count === null ? 'Loading...' : count}
    </div>
  );
};

export default VisitorCounter;