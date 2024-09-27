import { Sheet } from 'react-modal-sheet';
import { useState } from 'react';

function BottomComments() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open sheet</button>

      <Sheet 
      isOpen={isOpen} 
      onClose={() => setOpen(false)}
      snapPoints={[600, 400, 100, 0]}
      >
        
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>{/* Your sheet content goes here */}</Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop/>
      </Sheet>
    </>
  );
}

export default BottomComments