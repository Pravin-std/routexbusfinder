import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, Scan, RefreshCw, AlertCircle, Calendar, Clock, 
  Bus, MapPin, CreditCard, ArrowRight, Ticket, Loader2, X 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// Load Tesseract dynamically from CDN to avoid npm network install issues
const loadTesseract = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/tesseract.js@5.0.3/dist/tesseract.min.js";
    script.onload = () => {
      resolve((window as any).Tesseract);
    };
    script.onerror = (err) => {
      reject(err);
    };
    document.body.appendChild(script);
  });
};

export const SecureImage = ({ path, alt, className }: { path: string; alt?: string; className?: string }) => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) return;
    if (path.startsWith("http")) {
      setUrl(path);
      setLoading(false);
      return;
    }

    const loadSignedUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from("ticket-scans")
          .createSignedUrl(path, 3600);
        if (error) throw error;
        if (data?.signedUrl) {
          setUrl(data.signedUrl);
        }
      } catch (err) {
        console.error("Failed to load signed URL:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSignedUrl();
  }, [path]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} />;
};

interface PhysicalTicketScannerProps {
  ticketId?: string; // Optional reference to the digital ticket we scanned it from
  onScanComplete?: (scanData: any) => void;
}

export const PhysicalTicketScanner: React.FC<PhysicalTicketScannerProps> = ({ 
  ticketId,
  onScanComplete 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "camera" | "processing" | "result">("idle");
  
  // Camera state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Capturing state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  
  // Result state
  const [extractedTicket, setExtractedTicket] = useState<any>(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Open camera & request permission
  const startCamera = async () => {
    setCameraError(null);
    setStep("camera");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCameraError("Only authenticated users can upload ticket images. Please log in first.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Rear camera preferred
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let friendlyMessage = "Failed to access camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        friendlyMessage = "Camera permission was denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        friendlyMessage = "No camera found on this device.";
      }
      setCameraError(friendlyMessage);
    }
  };

  // Cleanup camera on close or unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera();
      runOCRAndSave(dataUrl);
    }
  };

  // Parse OCR text using regular expressions
  const parseOcrText = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    
    let busName = "";
    let busNumber = "";
    let fromStop = "";
    let toStop = "";
    let fare = 0;
    let travelDate = "";
    let travelTime = "";
    let ticketNumber = "";
    let seatNumber = "";
    let conductorNumber = "";

    // 1. Bus Name
    const busKeywords = ["travels", "transport", "express", "ksrtc", "setc", "tnstc", "mtc", "apsrtc", "msrtc", "bus", "coaching", "line", "tourist", "government", "corporation"];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (busKeywords.some(kw => lower.includes(kw))) {
        busName = line;
        break;
      }
    }
    if (!busName && lines.length > 0) {
      busName = lines[0].slice(0, 50);
    }

    // 2. Bus Number (e.g. TN-01-AN-1234)
    const busNumRegex = /([A-Z]{2}\s*\d{2}\s*[A-Z\s]{0,3}\s*\d{4})/i;
    const busNumMatch = text.match(busNumRegex);
    if (busNumMatch) {
      busNumber = busNumMatch[1].replace(/\s+/g, " ").toUpperCase().trim();
    }

    // 3. Ticket Number
    const tktRegexes = [
      /(?:ticket|tkt|pnr|no\.?|id)[:\s]+([a-z0-9-]+)/i,
      /tkt\s*([a-z0-9-]+)/i,
      /pnr\s*([a-z0-9-]+)/i,
      /\b(\d{7,12})\b/
    ];
    for (const regex of tktRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        ticketNumber = match[1].trim();
        break;
      } else if (match && match[0]) {
        ticketNumber = match[0].trim();
        break;
      }
    }
    if (!ticketNumber) {
      ticketNumber = "TX-" + Math.floor(Math.random() * 900000 + 100000);
    }

    // 4. Fare
    const fareRegexes = [
      /(?:fare|price|amount|amt|total|rs\.?|inr|₹)[:\s]*(\d+(?:\.\d{1,2})?)/i,
      /(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)/i,
      /\b(\d{2,4})\b/
    ];
    for (const regex of fareRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed > 0) {
          fare = parsed;
          break;
        }
      }
    }

    // 5. Travel Date
    const dateRegexes = [
      /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/,
      /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/,
      /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})/i
    ];
    let parsedDate: Date | null = null;
    for (const regex of dateRegexes) {
      const match = text.match(regex);
      if (match) {
        if (regex.source.includes("jan")) {
          const day = parseInt(match[1]);
          const monthStr = match[2].toLowerCase();
          const yearStr = match[3];
          const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
          const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
          parsedDate = new Date(year, months[monthStr], day);
          break;
        } else if (match[1].length === 4) {
          parsedDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          break;
        } else {
          const dayOrMonth = parseInt(match[1]);
          const monthOrDay = parseInt(match[2]);
          const yearStr = match[3];
          const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
          if (dayOrMonth > 12) {
            parsedDate = new Date(year, monthOrDay - 1, dayOrMonth);
          } else {
            parsedDate = new Date(year, dayOrMonth - 1, monthOrDay);
          }
          break;
        }
      }
    }
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      travelDate = parsedDate.toISOString().split("T")[0];
    } else {
      travelDate = new Date().toISOString().split("T")[0];
    }

    // 6. Travel Time
    const timeRegex = /(\d{1,2})[:.](\d{2})(?:\s*([ap]m))?/i;
    const timeMatch = text.match(timeRegex);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const min = timeMatch[2];
      const ampm = timeMatch[3];
      if (ampm) {
        const isPm = ampm.toLowerCase() === "pm";
        if (isPm && hour < 12) hour += 12;
        if (!isPm && hour === 12) hour = 0;
      }
      travelTime = `${hour.toString().padStart(2, "0")}:${min}`;
    } else {
      travelTime = new Date().toTimeString().split(" ")[0].slice(0, 5);
    }

    // 7. From / To Stop
    const fromToRegex = /(?:from|src|source)[:\s]+([a-z\s]{3,20})(?:\b|to|dest|destination)/i;
    const toFromRegex = /(?:to|dest|destination)[:\s]+([a-z\s]{3,20})/i;
    
    const fromMatch = text.match(fromToRegex);
    if (fromMatch && fromMatch[1]) {
      fromStop = fromMatch[1].trim();
    }
    const toMatch = text.match(toFromRegex);
    if (toMatch && toMatch[1]) {
      toStop = toMatch[1].trim();
    }

    if (!fromStop || !toStop) {
      const arrowRegex = /([a-z\s]{3,20})\s*(?:->|=>|to|—|-)\s*([a-z\s]{3,20})/i;
      const arrowMatch = text.match(arrowRegex);
      if (arrowMatch) {
        if (!fromStop) fromStop = arrowMatch[1].trim();
        if (!toStop) toStop = arrowMatch[2].trim();
      }
    }

    if (!fromStop) fromStop = "Unknown Source";
    if (!toStop) toStop = "Unknown Destination";

    // 8. Seat Number
    const seatRegex = /(?:seat|seat\s*no|seat\(s\))[:\s]*([a-z0-9\s,-]+)/i;
    const seatMatch = text.match(seatRegex);
    if (seatMatch && seatMatch[1]) {
      seatNumber = seatMatch[1].split("\n")[0].trim();
    }

    // 9. Conductor Number
    const condRegex = /(?:conductor|cond\.?\s*no|mobile|phone)[:\s]*([0-9\s+]+)/i;
    const condMatch = text.match(condRegex);
    if (condMatch && condMatch[1]) {
      conductorNumber = condMatch[1].split("\n")[0].trim();
    }

    return {
      busName,
      busNumber,
      fromStop,
      toStop,
      fare,
      travelDate,
      travelTime,
      ticketNumber,
      seatNumber,
      conductorNumber
    };
  };

  // Convert base64 to Blob helper
  const base64ToBlob = (base64: string, mime: string) => {
    const byteString = atob(base64.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  };

  // Process image with OCR, upload to Storage and save to database
  const runOCRAndSave = async (imageUrl: string) => {
    setStep("processing");
    setOcrProgress(10);
    setProgressStatus("Loading OCR engine...");
    
    try {
      // 1. Initialize and run OCR
      const Tesseract = await loadTesseract();
      setOcrProgress(30);
      setProgressStatus("Analyzing ticket text...");
      
      const result = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(30 + Math.floor(m.progress * 40));
            setProgressStatus(`Extracting details (${Math.floor(m.progress * 100)}%)...`);
          }
        }
      });
      
      const ocrText = result.data.text;
      setOcrProgress(75);
      setProgressStatus("Processing details...");
      
      // 2. Extract ticket details
      const extracted = parseOcrText(ocrText);
      
      // 3. Upload photo to Supabase Storage
      setProgressStatus("Uploading image to storage...");
      const fileBlob = base64ToBlob(imageUrl, "image/jpeg");
      const fileName = `${user?.id || "guest"}_${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ticket-scans")
        .upload(fileName, fileBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false
        });
        
      if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        throw new Error("Failed to upload ticket photo to database.");
      }
      
      setOcrProgress(90);
      setProgressStatus("Generating digital ticket...");
      
      // 5. Save ticket scan into Supabase
      const ticketScanData = {
        user_id: user?.id || null,
        ticket_id:  null,
        ticket_photo_url: fileName,
        ocr_text: ocrText,
        bus_name: extracted.busName,
        bus_number: extracted.busNumber || "UNSPECIFIED",
        from_stop: extracted.fromStop,
        to_stop: extracted.toStop,
        fare: extracted.fare || null,
        travel_date: extracted.travelDate,
        travel_time: extracted.travelTime,
        ticket_number: ticketId || extracted.ticketNumber,
      };

      const { data: scanRow, error: dbError } = await supabase
        .from("ticket-scans" as any) // fallback in case TS types aren't fully reloaded
        .insert([ticketScanData])
        .select()
        .single();
        
      const dbSaveData = dbError ? null : scanRow;
      if (dbError) {
        console.error("Database save failed, trying fallback table name:", dbError);
        // Retry with ticket_scans (plural underscore)
        const { data: retryRow, error: retryError } = await supabase
          .from("ticket_scans" as any)
          .insert([ticketScanData])
          .select()
          .single();
          
        if (retryError) {
          console.error("Database insertion failed completely:", retryError);
          throw new Error("Failed to save scanned ticket details in database.");
        }
        
        setExtractedTicket({
          ...extracted,
          id: retryRow.id,
          ticketPhotoUrl: fileName,
          scanTimestamp: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        });
      } else {
        setExtractedTicket({
          ...extracted,
          id: dbSaveData.id,
          ticketPhotoUrl: fileName,
          scanTimestamp: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        });
      }
      
      setOcrProgress(100);
      toast.success("Ticket scanned and digital copy generated!");
      setStep("result");
      
      if (onScanComplete) {
        onScanComplete(extracted);
      }
    } catch (err: any) {
      console.error("OCR flow error:", err);
      toast.error(err.message || "An error occurred during OCR or saving.");
      setCameraError(err.message || "OCR or upload failed. Please try again.");
      setStep("camera"); // redirect to camera for retry
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    // Reset states
    setStep("idle");
    setCapturedImage(null);
    setOcrProgress(0);
    setProgressStatus("");
    setExtractedTicket(null);
  };

  return (
    <>
      <Button 
        onClick={() => {
          setIsOpen(true);
          startCamera();
        }}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02]"
      >
        <Scan className="h-5 w-5" />
        Scan Physical Ticket
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-[95%] p-0 overflow-hidden border border-border/80 bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-500" />
              {step === "camera" && "Capture Physical Ticket"}
              {step === "processing" && "Digitizing Ticket"}
              {step === "result" && "Scanned Digital Ticket"}
            </DialogTitle>
            <button 
              onClick={handleClose} 
              className="rounded-full p-1.5 hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          {/* Step 1: Camera Preview */}
          {step === "camera" && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              {cameraError ? (
                <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-xl bg-destructive/10 border border-destructive/20 w-full">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <h3 className="font-bold text-foreground">Camera Error</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cameraError}</p>
                  </div>
                  <Button 
                    onClick={startCamera} 
                    className="bg-primary hover:bg-primary/90 text-white px-6 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry Camera
                  </Button>
                </div>
              ) : (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border/50 shadow-inner">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Framing Overlay Box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[85%] h-[70%] border-2 border-dashed border-indigo-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white bg-indigo-500/80 px-2 py-0.5 rounded backdrop-blur-sm">
                        Align Ticket Inside Frame
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!cameraError && (
                <div className="flex w-full gap-3 pt-2">
                  <Button 
                    onClick={capturePhoto} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow flex items-center justify-center gap-2"
                  >
                    <Camera className="h-5 w-5" /> Take Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleClose} 
                    className="px-4 border-border text-muted-foreground hover:bg-secondary rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Processing / OCR */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center p-10 space-y-6 text-center">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center" />
                <Ticket className="absolute h-8 w-8 text-indigo-500 animate-pulse" />
              </div>
              
              <div className="space-y-2 w-full">
                <h3 className="font-bold text-lg text-foreground">{progressStatus}</h3>
                <p className="text-xs text-muted-foreground">Running on-device OCR engine</p>
                <Progress value={ocrProgress} className="h-2 bg-secondary" />
              </div>
            </div>
          )}

          {/* Step 3: Beautiful Generated Digital Ticket */}
          {step === "result" && extractedTicket && (
            <div className="flex flex-col p-4 max-h-[80vh] overflow-y-auto space-y-4">
              <div className="text-center pb-2">
                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                  ✓ Digitized Successfully
                </span>
              </div>

              {/* Original ticket photo card */}
              <div className="rounded-xl overflow-hidden border border-border/80 bg-secondary/10 relative group aspect-[2/1]">
                <SecureImage 
                  path={extractedTicket.ticketPhotoUrl} 
                  alt="Original Ticket Scan" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <span className="text-[10px] font-semibold text-white/90">Original Ticket Photo</span>
                </div>
              </div>

              {/* Digital ticket ticket representation */}
              <div className="relative rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-xl overflow-hidden bus-card-shadow">
                {/* Overlay design shapes */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Bus Badge */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide">
                    <Bus className="h-3.5 w-3.5" />
                    {extractedTicket.busNumber || "N/A"}
                  </span>
                  <span className="text-[10px] font-semibold text-white/60">
                    ID: {extractedTicket.id?.slice(-8) || "SCANNED"}
                  </span>
                </div>

                {/* From / To stops */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">From</p>
                    <p className="text-base font-extrabold truncate">{extractedTicket.fromStop}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/50" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">To</p>
                    <p className="text-base font-extrabold truncate">{extractedTicket.toStop}</p>
                  </div>
                </div>

                {/* Trip info: Date, Time, Price */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-xs">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </p>
                    <p className="font-bold mt-0.5">{extractedTicket.travelDate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" /> Time
                    </p>
                    <p className="font-bold mt-0.5">{extractedTicket.travelTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 flex items-center justify-end gap-1">
                      <CreditCard className="h-3 w-3" /> Fare
                    </p>
                    <p className="font-extrabold text-sm text-yellow-300 mt-0.5">
                      ₹{extractedTicket.fare}
                    </p>
                  </div>
                </div>

                {/* Additional scanned details */}
                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] text-white/80">
                  <div>
                    <span className="font-semibold text-white/50">Tkt No: </span>
                    {extractedTicket.ticketNumber}
                  </div>
                  {extractedTicket.seatNumber && (
                    <div className="text-right">
                      <span className="font-semibold text-white/50">Seat: </span>
                      {extractedTicket.seatNumber}
                    </div>
                  )}
                  {extractedTicket.conductorNumber && (
                    <div className="col-span-2">
                      <span className="font-semibold text-white/50">Conductor Info: </span>
                      {extractedTicket.conductorNumber}
                    </div>
                  )}
                  <div className="col-span-2 text-white/40 text-[9px] mt-1 italic">
                    Scanned at: {extractedTicket.scanTimestamp}
                  </div>
                </div>

                {/* Background watermarks */}
                <Ticket className="absolute right-2 bottom-2 h-16 w-16 text-white/5 -rotate-12 pointer-events-none" />
              </div>

              {/* Operator details block */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator:</span>
                  <span className="font-bold text-foreground">{extractedTicket.busName}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleClose} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow"
                >
                  Done
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleClose();
                    // Navigate to Scanned Tickets page
                    window.location.href = "/scanned-tickets";
                  }}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-xl"
                >
                  View Scanned List
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
