import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5Qrcode("qr-reader");

    // Check for camera permissions and list devices
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
          setPermissionGranted(true);
        } else {
          setError("No camera devices found.");
        }
      })
      .catch((err) => {
        setError(`Camera permission denied or error: ${err}`);
      });

    // Cleanup
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  const startScanner = () => {
    if (!scannerRef.current || !selectedCamera) return;
    
    setIsScanning(true);
    setError(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    scannerRef.current.start(
      selectedCamera,
      config,
      (decodedText) => {
        // On successful scan
        onScan(decodedText);
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
        }
        setIsScanning(false);
      },
      (errorMessage) => {
        // Handle errors silently during scanning
        console.error("QR Scan Error:", errorMessage);
      }
    ).catch(err => {
      setError(`Error starting scanner: ${err}`);
      setIsScanning(false);
    });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      setIsScanning(false);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isScanning) {
      stopScanner();
    }
    setSelectedCamera(e.target.value);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div id="qr-reader" className="w-full max-w-sm"></div>
      
      {error && (
        <div className="text-destructive text-sm mb-2">{error}</div>
      )}
      
      {cameras.length > 1 && (
        <div className="flex flex-col items-start w-full">
          <label htmlFor="camera-select" className="text-sm font-medium mb-1">
            Select Camera
          </label>
          <select
            id="camera-select"
            className="w-full px-3 py-2 border rounded-md"
            value={selectedCamera || ''}
            onChange={handleCameraChange}
            disabled={isScanning}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex space-x-4 mt-4">
        {!isScanning ? (
          <Button
            onClick={startScanner}
            disabled={!permissionGranted || !selectedCamera}
            className="flex items-center"
          >
            <Icons.qrCode className="mr-2 h-4 w-4" />
            Start Scanning
          </Button>
        ) : (
          <Button
            onClick={stopScanner}
            variant="outline"
            className="flex items-center"
          >
            <Icons.stop className="mr-2 h-4 w-4" />
            Stop Scanning
          </Button>
        )}
        
        <Button
          onClick={onClose}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
      
      <div className="text-center text-sm text-muted-foreground mt-4">
        Point your camera at a QR code to scan equipment information
      </div>
    </div>
  );
}