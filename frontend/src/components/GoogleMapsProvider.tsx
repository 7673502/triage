import { useJsApiLoader } from '@react-google-maps/api';
import { type ReactNode } from 'react';

const libraries = ['places']; // add other libraries if needed

type Props = {
  children: ReactNode;
};

export default function GoogleMapsProvider({ children }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  if (!isLoaded) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 0',
          color: '#94a3b8',
        }}
      >
        Loading maps...
      </div>
    );
  }

  return <>{children}</>;
}
