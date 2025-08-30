import React, { useEffect, useState, memo } from 'react';
import { Loader2 } from 'lucide-react';

interface UploaderProps {
  message?: string;
}

const Uploader = memo(({ message = "Uploading..." }: UploaderProps) => {
  const [gradientPosition, setGradientPosition] = useState(0);
  const [borderOpacity, setBorderOpacity] = useState(0.6);

  useEffect(() => {
    
    const gradientInterval = setInterval(() => {
      setGradientPosition(prev => (prev + 0.02) % 1);
    }, 20);

    
    let opacityDirection = 1;
    const opacityInterval = setInterval(() => {
      setBorderOpacity(prev => {
        const newValue = prev + (0.008 * opacityDirection);
        if (newValue >= 1) {
          opacityDirection = -1;
          return 1;
        } else if (newValue <= 0.6) {
          opacityDirection = 1;
          return 0.6;
        }
        return newValue;
      });
    }, 20);

    return () => {
      clearInterval(gradientInterval);
      clearInterval(opacityInterval);
    };
  }, []);

  
  const gradientAngle = gradientPosition * 360;
  
  
  const primaryColor = `rgba(100, 180, 255, ${0.4 + (borderOpacity - 0.6) * 1})`;
  const secondaryColor = `rgba(70, 120, 255, ${0.4 + (borderOpacity - 0.6) * 1})`;
  const tertiaryColor = `rgba(130, 80, 255, ${0.4 + (borderOpacity - 0.6) * 1})`;

  const gradientStyle = {
    background: `linear-gradient(${gradientAngle}deg, ${primaryColor}, ${secondaryColor}, ${tertiaryColor})`,
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg">
      <div 
        className="rounded-[22px] p-0.5 animate-pulse"
        style={gradientStyle}
      >
        <div className="flex items-center justify-center bg-white rounded-[20px] py-2 px-4">
          <div className="flex items-center justify-center w-6 h-6 bg-black/75 rounded-full">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
          <span className="text-sm text-black/75 font-medium ml-3">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
});

Uploader.displayName = 'Uploader';

export default Uploader;