import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Camera, Mic, FileText, MapPin, Sparkles, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, X, Shield,
  Building, Check, Volume2, Info, Eye
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as api from '../services/api'
import { useAuth } from '../context/AuthContext'

// Leaflet default icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Map click & drag handler
function LocationPickerMarker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const latlng = e.target.getLatLng()
          onPositionChange(latlng.lat, latlng.lng)
        },
      }}
    />
  ) : null
}

export default function CitizenReportWizard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Wizard Stage: 1 = Input, 2 = Location, 3 = AI Review, 4 = AI Recommendation & Questions, 5 = Priority Breakdown, 6 = Summary, 7 = Success
  const [currentStep, setCurrentStep] = useState(1)

  // Input states
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoQualityHint, setPhotoQualityHint] = useState('')

  // Voice states
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  // Text state
  const [descriptionText, setDescriptionText] = useState('')

  // Location states
  const [latitude, setLatitude] = useState(33.712)
  const [longitude, setLongitude] = useState(73.045)
  const [addressText, setAddressText] = useState('F-8 Markaz, Islamabad')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [locationSource, setLocationSource] = useState('default') // 'gps' or 'manual' or 'default'
  const [locationNotice, setLocationNotice] = useState('')

  // AI Review states
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [aiReviewError, setAiReviewError] = useState('')
  const [reviewProgressIndex, setReviewProgressIndex] = useState(0)

  // Follow-up questions state
  const [answeredQuestions, setAnsweredQuestions] = useState({})

  // Final Submission states
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const [createdReport, setCreatedReport] = useState(null)

  // Camera stream ref for live video
  const videoRef = useRef(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const cameraStreamRef = useRef(null)

  // Photo handlers
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    if (file.size < 20000) {
      setPhotoQualityHint('Photo size is small. A clear photo helps dispatch officers faster.')
    } else {
      setPhotoQualityHint('✓ Photo selected. Looks clear and ready for review.')
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      cameraStreamRef.current = stream
      setIsCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 200)
    } catch (err) {
      setPhotoQualityHint('Camera access unavailable. Please upload a photo from gallery.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
        setPhotoQualityHint('✓ Photo captured successfully.')
        stopCamera()
      }
    }, 'image/jpeg')
  }

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
    }
    setIsCameraActive(false)
  }

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Microphone permission denied. You can write your problem description instead.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
  }

  // GPS Geolocation
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('GPS is not supported by your browser. Please select your sector on the map.')
      setLocationSource('manual')
      return
    }

    setGpsLoading(true)
    setLocationNotice('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationSource('gps')
        setGpsLoading(false)
        setAddressText(`Sector F-8, Islamabad (GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`)
      },
      (err) => {
        setGpsLoading(false)
        setLocationSource('manual')
        setLocationNotice('Location permission was denied. Please adjust the pin on the map or enter your sector manually.')
      },
      { timeout: 8000 }
    )
  }

  // Trigger AI Review
  const runAiReview = async () => {
    setAnalyzing(true)
    setAiReviewError('')
    setReviewProgressIndex(0)
    setCurrentStep(3)

    // Visual progression steps
    const timer1 = setTimeout(() => setReviewProgressIndex(1), 500)
    const timer2 = setTimeout(() => setReviewProgressIndex(2), 1000)
    const timer3 = setTimeout(() => setReviewProgressIndex(3), 1500)

    try {
      const payload = {
        text: descriptionText,
        address: addressText,
        latitude: latitude,
        longitude: longitude,
      }
      if (photoFile) payload.image = photoFile
      if (audioBlob) payload.audio = audioBlob

      const res = await api.analyzeCivicReport(payload)
      if (res && res.success && res.analysis) {
        setAiAnalysisResult(res.analysis)
        // If voice provided and transcript received, update description
        if (res.analysis.transcript && !descriptionText) {
          setDescriptionText(res.analysis.transcript)
        }
        setTimeout(() => {
          setAnalyzing(false)
          setCurrentStep(4) // Move to recommendations & follow-up
        }, 1800)
      } else {
        throw new Error('Analysis could not be prepared.')
      }
    } catch (err) {
      console.warn('[AI Review Error]', err)
      setAnalyzing(false)
      setAiReviewError('Raabta AI could not complete automated analysis right now. You can still review your description and continue.')
    }
  }

  // Fallback if AI fails: continue manually with clean default analysis
  const continueManually = () => {
    const fallbackCategory = 'Roads & Infrastructure'
    const fallbackDept = {
      department_id: 'CDA',
      department_name: 'Capital Development Authority (CDA)',
      category: fallbackCategory,
      sla_hours: 48,
    }
    const fallbackAnalysis = {
      title: descriptionText ? `${descriptionText.slice(0, 35)}...` : 'Civic Problem Reported',
      detected_issue: 'Civic Problem',
      category: fallbackCategory,
      description: descriptionText || 'Citizen reported civic problem.',
      department: fallbackDept,
      evidence_quality: { quality_label: 'Fair', quality_score: 0.65, reason: 'Manual submission' },
      priority_score: 60,
      priority_level: 'HIGH',
      priority_factors: {
        public_safety: { score: 60, contribution: 18.0, reason: 'Standard assessment' },
        infrastructure_severity: { score: 60, contribution: 15.0, reason: 'Physical observation' },
        citizen_impact: { score: 60, contribution: 12.0, reason: 'Local area impact' },
        location_vulnerability: { score: 60, contribution: 9.0, reason: 'Standard location' },
        evidence_confidence: { score: 60, contribution: 6.0, reason: 'Citizen statement' },
      },
      follow_up_questions: [
        {
          id: 'q1',
          question: 'Is this problem affecting pedestrian or road traffic?',
          type: 'choice',
          options: ['Yes', 'No', 'Not Sure'],
        },
      ],
    }
    setAiAnalysisResult(fallbackAnalysis)
    setCurrentStep(4)
  }

  // Final submission to database
  const handleFinalSubmit = async () => {
    setSubmitting(true)
    setSubmissionError('')

    try {
      const finalTitle = aiAnalysisResult?.title || (descriptionText ? `${descriptionText.slice(0, 30)}` : 'Reported Civic Problem')
      const finalDeptId = aiAnalysisResult?.department?.department_id || 'CDA'
      const finalCategory = aiAnalysisResult?.category || 'Roads & Infrastructure'

      const answersArray = Object.entries(answeredQuestions).map(([qId, answer]) => ({
        question_id: qId,
        answer: answer,
      }))

      const payload = {
        title: finalTitle,
        description: descriptionText || finalTitle,
        category: finalCategory,
        department_id: finalDeptId,
        department: finalDeptId,
        latitude: latitude,
        longitude: longitude,
        address: addressText,
        city: 'Islamabad',
        transcript: aiAnalysisResult?.transcript || '',
        missing_information_answers: answersArray,
        citizen_phone: currentUser?.phone || '',
      }

      if (photoPreview && photoPreview.startsWith('data:')) {
        payload.image_base64 = photoPreview
      }

      const res = await api.createCivicReport(payload)
      if (res && res.success && res.report) {
        setCreatedReport(res.report)
        setCurrentStep(7) // Success!
      } else {
        throw new Error(res?.message || 'Report creation failed')
      }
    } catch (err) {
      setSubmissionError(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reviewChecklist = [
    'Reading your problem description',
    'Assessing photo clarity & surroundings',
    'Checking location in Islamabad region',
    'Preparing structured department report',
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Wizard Step Progress Tracker (Steps 1 to 6) */}
      {currentStep < 7 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Step {currentStep > 3 ? (currentStep === 6 ? 4 : 3) : currentStep} of 4</span>
            <span className="text-emerald-700 font-bold">
              {currentStep === 1 && '1. Evidence & Description'}
              {currentStep === 2 && '2. Location'}
              {currentStep === 3 && '3. Raabta AI Review'}
              {currentStep === 4 && '3. Recommendation & Questions'}
              {currentStep === 5 && '3. Priority Breakdown'}
              {currentStep === 6 && '4. Final Review & Approval'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-700 h-full transition-all duration-500 ease-out"
              style={{
                width: `${
                  currentStep === 1 ? 25 :
                  currentStep === 2 ? 50 :
                  currentStep === 3 ? 65 :
                  currentStep === 4 ? 75 :
                  currentStep === 5 ? 85 :
                  currentStep === 6 ? 95 : 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1: INPUT (Photo + Voice + Text combinations) */}
      {/* ============================================================ */}
      {currentStep === 1 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <span>Problem Reporting</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              What problem did you notice?
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Add a photo, record in Urdu or English, or write a description. You can combine them.
            </p>
          </div>

          {/* Section A: Photo Capture / Upload */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera size={15} className="text-emerald-700" />
                <span>Problem Photo (Recommended)</span>
              </span>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview('')
                    setPhotoQualityHint('')
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <X size={12} />
                  <span>Remove</span>
                </button>
              )}
            </label>

            {!photoPreview && !isCameraActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                  <div className="p-3 rounded-full bg-white shadow-2xs text-emerald-700 group-hover:scale-105 transition-transform">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Upload from Gallery</span>
                  <span className="text-[11px] text-slate-500">JPG, PNG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={startCamera}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <div className="p-3 rounded-full bg-white shadow-2xs text-emerald-700 group-hover:scale-105 transition-transform">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Open Camera</span>
                  <span className="text-[11px] text-slate-500">Take photo on your device</span>
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="space-y-3 p-4 bg-slate-900 rounded-2xl text-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-56 object-cover rounded-xl mx-auto" />
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Camera size={14} />
                    <span>Snap Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {photoPreview && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                <img
                  src={photoPreview}
                  alt="Problem Preview"
                  className="w-full h-48 sm:h-64 object-cover rounded-xl"
                />
                {photoQualityHint && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{photoQualityHint}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section B: Voice Recording */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic size={15} className="text-emerald-700" />
                <span>Tell Us What Happened (Voice in Urdu or English)</span>
              </span>
              {audioUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAudioBlob(null)
                    setAudioUrl('')
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <X size={12} />
                  <span>Delete Voice</span>
                </button>
              )}
            </label>

            {!audioUrl ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-900">
                    {isRecording ? `Recording... (${recordingSeconds}s)` : 'Speak in your own words'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Example: "Yahan bohat bara gaddha hai aur raat ko gaariyon ke liye dangerous hai."
                  </p>
                </div>

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <Mic size={15} />
                  <span>{isRecording ? 'Stop Recording' : 'Press to Record Voice'}</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 size={18} className="text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900">Voice Note Recorded ({recordingSeconds}s)</span>
                </div>
                <audio src={audioUrl} controls className="h-8 max-w-xs" />
              </div>
            )}
          </div>

          {/* Section C: Text Description */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={15} className="text-emerald-700" />
              <span>Describe the Problem</span>
            </label>
            <textarea
              rows={3}
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
              placeholder='For example: "There is a deep pothole near the school gate. Rainwater is accumulating and causing traffic congestion."'
              className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-700 outline-none text-xs text-slate-900 leading-relaxed transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              You do not need to choose departments or severity scores — Raabta AI will analyze them automatically.
            </p>
          </div>

          {/* Continue Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!photoFile && !audioBlob && !descriptionText.trim()}
              onClick={() => setCurrentStep(2)}
              className="py-3 px-7 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Continue to Location</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 2: LOCATION (GPS & Map Pin) */}
      {/* ============================================================ */}
      {currentStep === 2 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold inline-flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={13} />
              <span>Back to Evidence</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Where is the problem located?
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Verify your location or tap the map to place the pin precisely.
            </p>
          </div>

          {/* GPS Button and Address Field */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-emerald-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Current Selected Location</p>
                  <p className="text-[11px] text-slate-500">
                    Source: {locationSource === 'gps' ? 'Device GPS Verified' : 'Manual Map Pin'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={requestCurrentLocation}
                disabled={gpsLoading}
                className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-emerald-800 font-bold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} className={gpsLoading ? 'animate-spin' : ''} />
                <span>{gpsLoading ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
              </button>
            </div>

            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. Street 14, Sector F-8/2, Islamabad"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700"
            />

            {locationNotice && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Info size={15} className="text-amber-700 shrink-0" />
                <span>{locationNotice}</span>
              </div>
            )}
          </div>

          {/* Interactive Leaflet Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xs h-64 sm:h-80 relative">
            <MapContainer
              center={[latitude, longitude]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              />
              <LocationPickerMarker
                position={[latitude, longitude]}
                onPositionChange={(lat, lon) => {
                  setLatitude(lat)
                  setLongitude(lon)
                  setLocationSource('manual')
                }}
              />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-semibold text-slate-700 border border-slate-200 shadow">
              Tap anywhere or drag pin to adjust location
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={runAiReview}
              className="py-3 px-7 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <Sparkles size={15} />
              <span>Submit for AI Review</span>
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 3: AI REVIEW (Calm Soft Checklist) */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center space-y-6">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Sparkles size={36} className={analyzing ? 'animate-pulse' : ''} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Raabta AI is reviewing your report...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Analyzing photo evidence, extracting context, and matching the right municipal department.
            </p>
          </div>

          {/* Checklist */}
          <div className="max-w-md mx-auto space-y-3 text-left">
            {reviewChecklist.map((item, idx) => {
              const isDone = idx < reviewProgressIndex
              const isCurrent = idx === reviewProgressIndex
              return (
                <div
                  key={item}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 text-xs font-semibold ${
                    isDone
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : isCurrent
                      ? 'bg-white border-emerald-600 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span>{item}</span>
                </div>
              )
            })}
          </div>

          {/* AI Failure fallback */}
          {aiReviewError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3 text-left">
              <p className="font-semibold">{aiReviewError}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runAiReview}
                  className="py-1.5 px-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={continueManually}
                  className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-200"
                >
                  Continue Manually
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 4: AI RECOMMENDATION & FOLLOW-UP QUESTIONS */}
      {/* ============================================================ */}
      {currentStep === 4 && aiAnalysisResult && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-700" />
              <span>AI Analysis Result</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              We found a few details
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Raabta AI has evaluated your report. Please review the recommendations below.
            </p>
          </div>

          {/* Findings Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Identified Problem</span>
              <p className="text-base font-black text-slate-900">{aiAnalysisResult.detected_issue || aiAnalysisResult.title}</p>
              <p className="text-xs text-slate-600">{aiAnalysisResult.category}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggested Department</span>
              <p className="text-base font-black text-slate-900">{aiAnalysisResult.department?.department_name}</p>
              <p className="text-xs text-emerald-700 font-semibold">Response Time: {aiAnalysisResult.recommended_sla_hours}h target</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority Score</span>
              <p className="text-base font-black text-slate-900">
                {aiAnalysisResult.priority_score} / 100 — <span className="text-emerald-700">{aiAnalysisResult.priority_level} Priority</span>
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline"
              >
                Why is priority {aiAnalysisResult.priority_score}? View breakdown
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Information Quality</span>
              <p className="text-base font-black text-slate-900">
                {aiAnalysisResult.evidence_quality?.quality_label || 'Good'}
              </p>
              <p className="text-xs text-slate-600 truncate">{aiAnalysisResult.evidence_quality?.reason}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <Info size={15} className="text-emerald-700 shrink-0" />
            <span>This is an AI-generated recommendation. You will review everything before final submission.</span>
          </div>

          {/* Follow-up Questions (1-2 quick questions) */}
          {aiAnalysisResult.follow_up_questions && aiAnalysisResult.follow_up_questions.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Quick Clarifying Questions (Optional)</span>
              </h3>

              {aiAnalysisResult.follow_up_questions.slice(0, 2).map((q) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800">{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {(q.options || ['Yes', 'No', 'Not Sure']).map((opt) => {
                      const isSelected = answeredQuestions[q.id] === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnsweredQuestions((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="py-2.5 px-4 rounded-xl text-emerald-800 hover:bg-emerald-50 text-xs font-bold border border-emerald-200"
              >
                View Priority Factors
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <span>Continue to Summary</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 5: EXPLAINABLE PRIORITY BREAKDOWN */}
      {/* ============================================================ */}
      {currentStep === 5 && aiAnalysisResult && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold inline-flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={13} />
              <span>Back to Analysis</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Priority Score: {aiAnalysisResult.priority_score} / 100
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Calculated using Raabta AI's transparent 5-factor civic risk engine.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Public Safety Risk', weight: '30%', score: aiAnalysisResult.priority_factors?.public_safety?.score || 70, reason: aiAnalysisResult.priority_factors?.public_safety?.reason },
              { label: 'Infrastructure Severity', weight: '25%', score: aiAnalysisResult.priority_factors?.infrastructure_severity?.score || 65, reason: aiAnalysisResult.priority_factors?.infrastructure_severity?.reason },
              { label: 'Public & Traffic Impact', weight: '20%', score: aiAnalysisResult.priority_factors?.citizen_impact?.score || 60, reason: aiAnalysisResult.priority_factors?.citizen_impact?.reason },
              { label: 'Location Context', weight: '15%', score: aiAnalysisResult.priority_factors?.location_vulnerability?.score || 55, reason: aiAnalysisResult.priority_factors?.location_vulnerability?.reason },
              { label: 'Information & Evidence', weight: '10%', score: aiAnalysisResult.priority_factors?.evidence_confidence?.score || 80, reason: aiAnalysisResult.priority_factors?.evidence_confidence?.reason },
            ].map((factor) => (
              <div key={factor.label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{factor.label} ({factor.weight})</span>
                  <span className="font-mono font-bold text-emerald-800">{factor.score} / 100</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-700 h-full rounded-full" style={{ width: `${factor.score}%` }} />
                </div>
                {factor.reason && <p className="text-[11px] text-slate-500 italic">{factor.reason}</p>}
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-4 rounded-xl text-slate-600 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <span>Continue to Summary</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 6: REPORT SUMMARY & APPROVAL */}
      {/* ============================================================ */}
      {currentStep === 6 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <span>Final Review</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Review your report
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Please inspect the details before submitting to the concerned department.
            </p>
          </div>

          {/* Dossier Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 text-xs">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Problem</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {aiAnalysisResult?.title || 'Civic Problem'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Priority: {aiAnalysisResult?.priority_score || 60}/100
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concerned Department</span>
                <p className="font-bold text-slate-900 mt-0.5">{aiAnalysisResult?.department?.department_name}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</span>
                <p className="font-bold text-slate-900 mt-0.5">{addressText}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</span>
              <p className="text-slate-700 leading-relaxed mt-0.5 bg-white p-3 rounded-xl border border-slate-200">
                {descriptionText || aiAnalysisResult?.description || 'No additional narrative provided.'}
              </p>
            </div>

            {photoPreview && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attached Photo</span>
                <img src={photoPreview} alt="Attached" className="mt-1 h-36 w-full object-cover rounded-xl border border-slate-200" />
              </div>
            )}

            {Object.keys(answeredQuestions).length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clarifying Answers</span>
                {Object.entries(answeredQuestions).map(([qId, ans]) => (
                  <p key={qId} className="text-slate-700 text-xs">
                    • Answer: <strong className="text-slate-900">{ans}</strong>
                  </p>
                ))}
              </div>
            )}
          </div>

          {submissionError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {submissionError}
            </div>
          )}

          {/* Submission action bar */}
          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Edit Information
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="py-3.5 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Submitting to Department...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 7: SUBMISSION SUCCESS */}
      {/* ============================================================ */}
      {currentStep === 7 && createdReport && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 size={44} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Report Submitted Successfully
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your report has been received and routed to <strong>{createdReport.department_name || 'concerned municipal authority'}</strong>.
            </p>
          </div>

          {/* Tracking ID badge */}
          <div className="max-w-xs mx-auto p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Your Official Tracking ID</span>
            <p className="text-xl sm:text-2xl font-mono font-black text-emerald-900">
              {createdReport.tracking_id}
            </p>
            <p className="text-[10px] text-slate-500">Save this ID to check status at any time</p>
          </div>

          {/* Next Steps Card */}
          <div className="max-w-md mx-auto text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-900 uppercase text-[10px]">What happens next?</span>
            <p className="text-slate-600">
              1. A duty officer will be assigned based on priority.
            </p>
            <p className="text-slate-600">
              2. You will receive in-app notifications as work progresses.
            </p>
            <p className="text-slate-600">
              3. Once repaired, you will be invited to confirm resolution.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/app/reports/${createdReport.id || createdReport._id || createdReport.tracking_id}`}
              className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Track My Report
            </Link>
            <Link
              to="/app/reports"
              className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors"
            >
              View My Reports
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
