import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Camera, Mic, FileText, MapPin, Sparkles, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, X, Shield,
  Building, Check, Volume2, Info, Eye, HelpCircle, RotateCcw
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

const DRAFT_STORAGE_KEY = 'raabta_report_draft_v1'

export default function CitizenReportWizard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Steps:
  // 1 = Capture (Photo, Voice, Text)
  // 2 = Location (GPS & Map)
  // 3 = AI Initial Analysis
  // 4 = Clarifying Questions (if needed)
  // 5 = Deterministic Priority
  // 6 = Review & Confirm
  // 7 = Submitted Confirmation
  const [currentStep, setCurrentStep] = useState(1)

  // Evidence states
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
  const [locationSource, setLocationSource] = useState('preset') // 'gps' | 'map' | 'preset' | 'manual'
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  const [locationNotice, setLocationNotice] = useState('')

  // AI Review states
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [aiReviewError, setAiReviewError] = useState('')
  const [reviewProgressIndex, setReviewProgressIndex] = useState(0)

  // Follow-up questions state: { [qId]: answer }
  const [answeredQuestions, setAnsweredQuestions] = useState({})

  // Priority Calculation states
  const [priorityCalculating, setPriorityCalculating] = useState(false)

  // Final Submission states
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const [createdReport, setCreatedReport] = useState(null)

  // Draft banner indicator
  const [restoredFromDraft, setRestoredFromDraft] = useState(false)

  // Camera stream ref for live video
  const videoRef = useRef(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const cameraStreamRef = useRef(null)

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && (parsed.descriptionText || parsed.aiAnalysisResult || parsed.answeredQuestions)) {
          if (parsed.descriptionText) setDescriptionText(parsed.descriptionText)
          if (parsed.latitude) setLatitude(parsed.latitude)
          if (parsed.longitude) setLongitude(parsed.longitude)
          if (parsed.addressText) setAddressText(parsed.addressText)
          if (parsed.locationSource) setLocationSource(parsed.locationSource)
          if (parsed.gpsAccuracy) setGpsAccuracy(parsed.gpsAccuracy)
          if (parsed.aiAnalysisResult) setAiAnalysisResult(parsed.aiAnalysisResult)
          if (parsed.answeredQuestions) setAnsweredQuestions(parsed.answeredQuestions)
          if (parsed.currentStep && parsed.currentStep > 1 && parsed.currentStep < 7) {
            setCurrentStep(parsed.currentStep)
          }
          setRestoredFromDraft(true)
        }
      }
    } catch (e) {
      console.warn('[Draft] Failed to restore draft:', e)
    }
  }, [])

  // Persist draft on changes
  useEffect(() => {
    if (currentStep > 1 && currentStep < 7) {
      try {
        const draft = {
          descriptionText,
          latitude,
          longitude,
          addressText,
          locationSource,
          gpsAccuracy,
          aiAnalysisResult,
          answeredQuestions,
          currentStep
        }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
      } catch (e) {}
    }
  }, [currentStep, descriptionText, latitude, longitude, addressText, locationSource, gpsAccuracy, aiAnalysisResult, answeredQuestions])

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {}
    setDescriptionText('')
    setPhotoFile(null)
    setPhotoPreview('')
    setAudioBlob(null)
    setAudioUrl('')
    setAnsweredQuestions({})
    setAiAnalysisResult(null)
    setCurrentStep(1)
    setRestoredFromDraft(false)
  }

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
      setIsCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      cameraStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn('Camera access denied:', err)
      setIsCameraActive(false)
      alert('Camera access denied. Please select a photo from your gallery.')
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
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' })
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
        setPhotoQualityHint('✓ Photo captured successfully from device camera.')
      }
      stopCamera()
    }, 'image/jpeg', 0.9)
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
      audioChunksRef.current = []

      let options = { mimeType: 'audio/webm' }
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = MediaRecorder.isTypeSupported('audio/mp4')
          ? { mimeType: 'audio/mp4' }
          : {}
      }

      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: mime })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.warn('Microphone access denied:', err)
      alert('Microphone access was denied. Please write your description instead.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
  }

  // GPS Geolocation with Nominatim Reverse Geocoding
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('GPS is not supported by your browser. Please select your sector on the map.')
      setLocationSource('manual')
      return
    }

    setGpsLoading(true)
    setLocationNotice('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const acc = pos.coords.accuracy
        setLatitude(lat)
        setLongitude(lon)
        setGpsAccuracy(acc)
        setLocationSource('gps')

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3500)
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en' },
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          if (res.ok) {
            const data = await res.json()
            const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || data.address?.road || ''
            const city = data.address?.city || data.address?.town || data.address?.state_district || 'Islamabad'
            const formatted = suburb ? `${suburb}, ${city}` : (data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `GPS: (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
            setAddressText(formatted)
          } else {
            setAddressText(`GPS Coordinates: (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
          }
        } catch {
          setAddressText(`GPS Coordinates: (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsLoading(false)
        setLocationSource('manual')
        setLocationNotice('Location permission was denied or timed out. Please enter your address or sector manually.')
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // STEP 2 -> STEP 3: Initial AI Analysis (Without showing final numerical priority)
  const runAiReview = async () => {
    setAnalyzing(true)
    setAiReviewError('')
    setReviewProgressIndex(0)
    setCurrentStep(3)

    // Visual progression steps
    setTimeout(() => setReviewProgressIndex(1), 400)
    setTimeout(() => setReviewProgressIndex(2), 800)
    setTimeout(() => setReviewProgressIndex(3), 1200)

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
        if (res.analysis.transcript && !descriptionText) {
          setDescriptionText(res.analysis.transcript)
        }
        setTimeout(() => {
          setAnalyzing(false)
        }, 1500)
      } else {
        throw new Error('Analysis could not be prepared.')
      }
    } catch (err) {
      console.warn('[AI Review Error]', err)
      setAnalyzing(false)
      setAiReviewError('Raabta AI could not complete automated analysis right now. You can still review your description and continue.')
    }
  }

  // Fallback if AI fails
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
      needs_follow_up: false,
      follow_up_questions: [],
    }
    setAiAnalysisResult(fallbackAnalysis)
    setAnalyzing(false)
    runPriorityCalculation(fallbackAnalysis)
  }

  // STEP 4 -> STEP 5: Recalculate Priority with Follow-up Answers
  const runPriorityCalculation = async (overrideAnalysis = null) => {
    setPriorityCalculating(true)
    const baseAnalysis = overrideAnalysis || aiAnalysisResult

    const answersArray = Object.entries(answeredQuestions).map(([qId, answer]) => {
      const qObj = baseAnalysis?.follow_up_questions?.find(q => q.id === qId)
      return {
        question_id: qId,
        question: qObj?.question || qId,
        answer: answer,
        answered_at: new Date().toISOString()
      }
    })

    try {
      const payload = {
        category: baseAnalysis?.category || 'Roads & Infrastructure',
        title: baseAnalysis?.title || descriptionText || 'Civic Incident',
        description: descriptionText || '',
        evidence_quality: baseAnalysis?.evidence_quality || 'good',
        location_text: addressText,
        latitude: latitude,
        longitude: longitude,
        answers: answersArray
      }

      const res = await api.calculatePriority(payload)
      if (res && res.success) {
        setAiAnalysisResult(prev => ({
          ...prev,
          priority_score: res.priority_score,
          priority_level: res.priority_level,
          priority_factors: res.priority_factors,
          civic_risk_score: res.civic_risk_score,
          recommended_sla_hours: res.recommended_sla_hours
        }))
      }
    } catch (err) {
      console.warn('[Priority Calculation Error]', err)
    } finally {
      setPriorityCalculating(false)
      setCurrentStep(5)
    }
  }

  // STEP 6 -> STEP 7: Final Submission
  const handleFinalSubmit = async () => {
    setSubmitting(true)
    setSubmissionError('')

    try {
      const finalTitle = aiAnalysisResult?.title || (descriptionText ? `${descriptionText.slice(0, 30)}` : 'Reported Civic Problem')
      const finalDeptId = aiAnalysisResult?.department?.department_id || 'CDA'
      const finalCategory = aiAnalysisResult?.category || 'Roads & Infrastructure'

      const answersArray = Object.entries(answeredQuestions).map(([qId, answer]) => {
        const qObj = aiAnalysisResult?.follow_up_questions?.find(q => q.id === qId)
        return {
          question_id: qId,
          question: qObj?.question || qId,
          answer: answer,
          answered_at: new Date().toISOString()
        }
      })

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
        missing_information_questions: aiAnalysisResult?.follow_up_questions || [],
        missing_information_answers: answersArray,
        citizen_phone: currentUser?.phone || '',
      }

      if (photoFile) {
        try {
          payload.image_base64 = await blobToBase64(photoFile)
        } catch (e) {
          console.warn('Could not encode photo:', e)
        }
      } else if (photoPreview && photoPreview.startsWith('data:')) {
        payload.image_base64 = photoPreview
      }

      if (audioBlob) {
        try {
          payload.audio_base64 = await blobToBase64(audioBlob)
        } catch (e) {
          console.warn('Could not encode audio:', e)
        }
      }

      const res = await api.createCivicReport(payload)
      if (res && res.success && res.report) {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        } catch {}
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
    'Reading problem description and context',
    'Assessing photo clarity and physical surroundings',
    'Matching jurisdiction across municipal agencies',
    'Preparing clarifying questions for risk engine',
  ]

  const hasFollowUpQuestions = aiAnalysisResult?.follow_up_questions && aiAnalysisResult.follow_up_questions.length > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* Restored Draft Banner */}
      {restoredFromDraft && currentStep < 7 && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span>Draft restored from your last session. You can continue or start fresh.</span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-rose-700 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Start Fresh</span>
          </button>
        </div>
      )}

      {/* Wizard Step Progress Tracker (Steps 1 to 6) */}
      {currentStep < 7 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Step {currentStep} of 6</span>
            <span className="text-emerald-700 font-bold">
              {currentStep === 1 && '1. Evidence & Description'}
              {currentStep === 2 && '2. Location'}
              {currentStep === 3 && '3. AI Initial Analysis'}
              {currentStep === 4 && '4. Clarifying Questions'}
              {currentStep === 5 && '5. Deterministic Priority'}
              {currentStep === 6 && '6. Review & Approval'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-700 h-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1: CAPTURE EVIDENCE (Photo + Voice + Text) */}
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
              Add a photo, record in Urdu or English, or write a description. You can combine any evidence.
            </p>
          </div>

          {/* Evidence Checklist State Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${photoFile || photoPreview ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <Camera size={14} className={photoFile || photoPreview ? 'text-emerald-700' : 'text-slate-400'} />
              <span>{photoFile || photoPreview ? '✓ Photo Added' : 'Photo'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${audioUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <Mic size={14} className={audioUrl ? 'text-emerald-700' : 'text-slate-400'} />
              <span>{audioUrl ? `✓ Voice (${recordingSeconds}s)` : 'Voice'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${descriptionText.trim() ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <FileText size={14} className={descriptionText.trim() ? 'text-emerald-700' : 'text-slate-400'} />
              <span>{descriptionText.trim() ? '✓ Details Added' : 'Details'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${locationSource === 'gps' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <MapPin size={14} className={locationSource === 'gps' ? 'text-emerald-700' : 'text-slate-400'} />
              <span>{locationSource === 'gps' ? '✓ GPS Active' : 'Location Set'}</span>
            </div>
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

          {/* Forward button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!photoFile && !audioBlob && !descriptionText.trim()}
              className="py-3 px-7 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Next: Set Location</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 2: LOCATION VERIFICATION & MAP */}
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
                    Source: {locationSource === 'gps' ? 'Device GPS Verified' : 'Location selected manually'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {gpsAccuracy && (
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                    GPS &plusmn;{Math.round(gpsAccuracy)}m ({gpsAccuracy < 30 ? 'High' : gpsAccuracy < 100 ? 'Medium' : 'Standard'})
                  </span>
                )}
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
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
      {/* STEP 3: AI INITIAL ANALYSIS (Without showing final priority) */}
      {/* ============================================================ */}
      {currentStep === 3 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm space-y-6 text-center">
          {analyzing ? (
            <>
              <div className="inline-flex p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Sparkles size={36} className="animate-pulse" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Raabta AI is analyzing your report...
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Understanding evidence, identifying issue category, and checking municipal jurisdiction.
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
            </>
          ) : aiAnalysisResult ? (
            <div className="text-left space-y-6">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-700" />
                  <span>AI Initial Assessment</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                  Initial Analysis Complete
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Raabta AI has evaluated your problem details. Review the initial findings below before priority scoring.
                </p>
              </div>

              {/* Initial Findings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identified Issue</span>
                  <p className="text-base font-black text-slate-900">{aiAnalysisResult.detected_issue || aiAnalysisResult.title}</p>
                  <p className="text-xs text-slate-600">{aiAnalysisResult.category}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Department</span>
                  <p className="text-base font-black text-slate-900">{aiAnalysisResult.department?.department_name}</p>
                  <p className="text-xs text-emerald-700 font-semibold">Response Target: {aiAnalysisResult.recommended_sla_hours}h SLA</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evidence Quality</span>
                  <p className="text-base font-black text-slate-900">
                    {aiAnalysisResult.evidence_quality?.quality_label || 'Good'}
                  </p>
                  <p className="text-xs text-slate-600 truncate">{aiAnalysisResult.evidence_quality?.reason}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Step</span>
                  <p className="text-base font-black text-slate-900">
                    {hasFollowUpQuestions ? 'Clarifying Questions' : 'Priority Calculation'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {hasFollowUpQuestions ? '1–2 questions will improve priority accuracy' : 'All required information is present'}
                  </p>
                </div>
              </div>

              {/* Status Callout */}
              {hasFollowUpQuestions ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <HelpCircle size={18} className="text-amber-700 shrink-0" />
                    <div>
                      <p className="font-bold">A few quick questions will help assess the priority accurately.</p>
                      <p className="text-amber-800 text-[11px]">Answering these helps our deterministic risk engine score the severity.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs whitespace-nowrap shadow-xs"
                  >
                    Answer Questions
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <p className="font-bold">No additional information needed.</p>
                      <p className="text-emerald-800 text-[11px]">All required evidence is present to calculate the deterministic priority.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => runPriorityCalculation()}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs whitespace-nowrap shadow-xs"
                  >
                    Calculate Priority
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Back to Location
                </button>
                {hasFollowUpQuestions ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                  >
                    <span>Continue to Follow-up</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => runPriorityCalculation()}
                    className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
                  >
                    <span>Calculate Priority</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 4: FOLLOW-UP QUESTIONS (Only when questions are needed) */}
      {/* ============================================================ */}
      {currentStep === 4 && aiAnalysisResult && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <HelpCircle size={13} className="text-emerald-700" />
              <span>Targeted Clarifications</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Help us understand the issue better
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              A few quick answers will help our deterministic risk engine assess the report more accurately.
            </p>
          </div>

          {/* Follow-up Questions List */}
          {hasFollowUpQuestions ? (
            <div className="space-y-4">
              {aiAnalysisResult.follow_up_questions.slice(0, 2).map((q, idx) => (
                <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{q.question}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(q.options || ['Yes', 'No', 'Not Sure']).map((opt) => {
                      const isSelected = answeredQuestions[q.id || idx] === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnsweredQuestions((prev) => ({ ...prev, [q.id || idx]: opt }))}
                          className={`py-1.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
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
          ) : (
            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-600 font-semibold">No additional information is required for this report.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runPriorityCalculation()}
                className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Skip Questions
              </button>
              <button
                type="button"
                onClick={() => runPriorityCalculation()}
                disabled={priorityCalculating}
                className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs"
              >
                <Sparkles size={14} className={priorityCalculating ? 'animate-spin' : ''} />
                <span>{priorityCalculating ? 'Calculating...' : 'Calculate Priority Score'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 5: DETERMINISTIC PRIORITY BREAKDOWN */}
      {/* ============================================================ */}
      {currentStep === 5 && aiAnalysisResult && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <button
              type="button"
              onClick={() => setCurrentStep(hasFollowUpQuestions ? 4 : 3)}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold inline-flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Civic Risk Score: {aiAnalysisResult.priority_score} / 100
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Level: <span className="font-bold text-emerald-800">{aiAnalysisResult.priority_level} Priority</span> &bull; SLA: <span className="font-bold text-slate-800">{aiAnalysisResult.recommended_sla_hours} hours</span>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Deterministic Engine
              </span>
            </div>
          </div>

          {/* 5-Factor Explainable Breakdown */}
          <div className="space-y-3">
            {[
              { label: 'Public Safety Risk', weight: '30%', score: aiAnalysisResult.priority_factors?.public_safety?.score || 70, reason: aiAnalysisResult.priority_factors?.public_safety?.reason },
              { label: 'Infrastructure Severity', weight: '25%', score: aiAnalysisResult.priority_factors?.infrastructure_severity?.score || 65, reason: aiAnalysisResult.priority_factors?.infrastructure_severity?.reason },
              { label: 'Citizen Impact', weight: '20%', score: aiAnalysisResult.priority_factors?.citizen_impact?.score || 60, reason: aiAnalysisResult.priority_factors?.citizen_impact?.reason },
              { label: 'Location Context', weight: '15%', score: aiAnalysisResult.priority_factors?.location_vulnerability?.score || 55, reason: aiAnalysisResult.priority_factors?.location_vulnerability?.reason },
              { label: 'Evidence Confidence', weight: '10%', score: aiAnalysisResult.priority_factors?.evidence_confidence?.score || 80, reason: aiAnalysisResult.priority_factors?.evidence_confidence?.reason },
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
              onClick={() => setCurrentStep(hasFollowUpQuestions ? 4 : 3)}
              className="py-2.5 px-4 rounded-xl text-slate-600 text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <span>Review Everything</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 6: FINAL DOSSIER REVIEW & APPROVAL */}
      {/* ============================================================ */}
      {currentStep === 6 && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
              <span>Step 6 of 6</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Review your report
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Please inspect the complete dossier before submitting to the concerned municipal department.
            </p>
          </div>

          {/* Complete Dossier Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 text-xs">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Problem Title</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {aiAnalysisResult?.title || 'Civic Problem'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Priority: {aiAnalysisResult?.priority_score || 50}/100 ({aiAnalysisResult?.priority_level || 'MEDIUM'})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Department</span>
                <p className="font-bold text-slate-900 mt-0.5">{aiAnalysisResult?.department?.department_name || 'CDA'}</p>
                <p className="text-[11px] text-emerald-700">SLA Target: {aiAnalysisResult?.recommended_sla_hours || 48} hours</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</span>
                <p className="font-bold text-slate-900 mt-0.5">{addressText}</p>
                <p className="text-[11px] text-slate-500">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)} ({locationSource === 'gps' ? 'Device GPS' : 'Manual Pin'})
                </p>
              </div>
            </div>

            {/* Description */}
            {descriptionText && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Citizen Description</span>
                <p className="text-slate-800 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {descriptionText}
                </p>
              </div>
            )}

            {/* Evidence Previews: Photo & Audio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              {photoPreview && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attached Photo</span>
                  <img
                    src={photoPreview}
                    alt="Evidence"
                    className="w-full h-32 object-cover rounded-xl mt-1 border border-slate-200"
                  />
                </div>
              )}

              {audioUrl && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attached Voice Note</span>
                  <div className="mt-1 p-3 rounded-xl bg-white border border-slate-200">
                    <audio src={audioUrl} controls className="w-full h-8" />
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up Information Provided */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Additional Information</span>
              {Object.keys(answeredQuestions).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(answeredQuestions).map(([qId, answer]) => {
                    const qObj = aiAnalysisResult?.follow_up_questions?.find(q => q.id === qId)
                    return (
                      <div key={qId} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px]">
                        <p className="font-bold text-slate-800">{qObj?.question || qId}</p>
                        <p className="text-emerald-800 font-semibold mt-0.5">Answer: {answer}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200">
                  No additional information was required.
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <Info size={15} className="text-emerald-700 shrink-0" />
              <span>This is an AI-generated recommendation. You are in full control and can review before submitting.</span>
            </div>
          </div>

          {submissionError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {submissionError}
            </div>
          )}

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Back to Priority
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="py-3 px-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <Check size={16} className={submitting ? 'animate-spin' : ''} />
              <span>{submitting ? 'Submitting Report...' : 'Submit Official Report'}</span>
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 7: SUCCESSFUL SUBMISSION CONFIRMATION */}
      {/* ============================================================ */}
      {currentStep === 7 && createdReport && (
        <section className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 size={44} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
              Report Successfully Logged
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Your report has been submitted
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
              Your complaint has been queued for municipal dispatch under SLA supervision.
            </p>
          </div>

          {/* Tracking ID Ticket */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Official Tracking ID</span>
            <p className="text-2xl font-mono font-black text-emerald-800 tracking-wider select-all">
              {createdReport.tracking_id}
            </p>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-600">
              <span>Department: <strong>{createdReport.department_name || createdReport.department_id}</strong></span>
              <span>Target SLA: <strong>{createdReport.sla_hours || 48}h</strong></span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to={`/app/reports/${createdReport.id || createdReport._id}`}
              className="w-full sm:w-auto py-3 px-7 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
            >
              Track Complaint Details
            </Link>
            <button
              type="button"
              onClick={() => {
                clearDraft()
                setCurrentStep(1)
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200"
            >
              Report Another Problem
            </button>
          </div>
        </section>
      )}

    </div>
  )
}
