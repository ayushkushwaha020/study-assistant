"use client";
import { ChangeEvent, useRef, useState } from "react";
import { BookOpen, BrainCircuit, CalendarDays, CheckCircle2, FileText, LoaderCircle, Mic, Sparkles, Upload, X } from "lucide-react";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

type Tool = "plan" | "quiz" | "pdf";
type QuizQuestion = { question: string; options: string[]; answerIndex: number; explanation: string };
type Quiz = { title: string; questions: QuizQuestion[] };
type SpeechRecognitionLike = { lang: string; interimResults: boolean; maxAlternatives: number; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void };

export default function SonaTools() {
  const [tool, setTool] = useState<Tool>("plan"), [topic, setTopic] = useState(""), [days, setDays] = useState("7"), [level, setLevel] = useState("University student");
  const [pdfName, setPdfName] = useState(""), [sourceText, setSourceText] = useState(""), [question, setQuestion] = useState("");
  const [result, setResult] = useState(""), [quiz, setQuiz] = useState<Quiz | null>(null), [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [voiceActive, setVoiceActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function readPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setError(""); setResult(""); setQuiz(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF file."); event.target.value = ""; return; }
    if (file.size > 4 * 1024 * 1024) { setError("PDFs must be 4 MB or smaller for this demo."); event.target.value = ""; return; }
    setBusy(true);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const document = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
      const pages: string[] = []; let totalChars = 0;
      for (let pageNo = 1; pageNo <= Math.min(document.numPages, 80); pageNo++) {
        const page = await document.getPage(pageNo); const content = await page.getTextContent();
        const text = content.items.map((item) => "str" in item ? item.str : "").join(" ");
        if (text.trim()) pages.push("[Page " + pageNo + "]\n" + text);
        totalChars += text.length; if (totalChars >= 24000) break;
      }
      const extracted = pages.join("\n\n").slice(0, 24000);
      if (!extracted.trim()) throw new Error("No selectable text found. Scanned PDFs need OCR, which is not enabled yet.");
      setSourceText(extracted); setPdfName(file.name); setTool("pdf");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't read that PDF."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function runTool() {
    setBusy(true); setError(""); setResult(""); setQuiz(null); setSubmitted(false); setAnswers({});
    try {
      const action = tool === "pdf" ? "pdf-ask" : tool;
      const response = await fetch("/api/study-tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, topic, days: Number(days), level, sourceText: tool === "pdf" || (tool === "quiz" && sourceText) ? sourceText : "", question }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "The study tool couldn't complete this request.");
      if (tool === "quiz") {
        const parsed = JSON.parse(data.result) as Quiz;
        if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5 || parsed.questions.some((q) => !Array.isArray(q.options) || q.options.length !== 4 || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3)) throw new Error("The quiz response wasn't in the expected format. Please try again.");
        setQuiz(parsed);
      } else setResult(data.result);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  function startVoice() {
    const scope = window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SpeechRecognition = scope.SpeechRecognition || scope.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Speech recognition isn't supported here. Try Chrome or type your question."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "en-IN"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onresult = (event) => setQuestion(event.results[0]?.[0]?.transcript || "");
    recognition.onerror = () => { setVoiceActive(false); setError("Microphone input failed. Check browser permissions and try again."); };
    recognition.onend = () => setVoiceActive(false); recognition.start(); setVoiceActive(true); setError("");
  }
  const score = quiz ? quiz.questions.reduce((sum, q, i) => sum + (answers[i] === q.answerIndex ? 1 : 0), 0) : 0;

  return <section className="sona-tools panel" id="sona-tools">
    <div className="sona-tools-head"><div><span className="sona-kicker"><Sparkles size={14}/> SONA STUDY LAB</span><h3>Turn study time into progress</h3><p>Build a roadmap, test your knowledge, or ask questions about your own PDF.</p></div><div className="sona-head-icon"><BrainCircuit size={24}/></div></div>
    <div className="sona-tool-tabs" role="tablist" aria-label="Study tools">
      <button type="button" role="tab" aria-selected={tool === "plan"} className={tool === "plan" ? "selected" : ""} onClick={() => {setTool("plan");setError("");}}><CalendarDays size={16}/> Study plan</button>
      <button type="button" role="tab" aria-selected={tool === "quiz"} className={tool === "quiz" ? "selected" : ""} onClick={() => {setTool("quiz");setError("");}}><BrainCircuit size={16}/> Quiz maker</button>
      <button type="button" role="tab" aria-selected={tool === "pdf"} className={tool === "pdf" ? "selected" : ""} onClick={() => {setTool("pdf");setError("");}}><FileText size={16}/> PDF tutor</button>
    </div>
    <div className="sona-tool-form">
      {tool !== "pdf" && <label>What are you studying?<input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={tool === "plan" ? "e.g. Java and data structures in 30 days" : "e.g. Object-oriented programming"} maxLength={500}/></label>}
      <div className="sona-form-row"><label>Study level<select value={level} onChange={(e) => setLevel(e.target.value)}><option>High school</option><option>University student</option><option>Beginner</option><option>Exam revision</option><option>Advanced</option></select></label>{tool === "plan" && <label>Plan length<select value={days} onChange={(e) => setDays(e.target.value)}><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>}</div>
      {(tool === "pdf" || tool === "quiz") && <div className="sona-upload-box"><input ref={fileInput} type="file" accept="application/pdf,.pdf" onChange={(e) => void readPdf(e)} hidden/><button type="button" className="sona-upload-button" onClick={() => fileInput.current?.click()} disabled={busy}><Upload size={17}/> {pdfName ? "Replace PDF" : "Upload a PDF"} <span>· max 4 MB</span></button>{pdfName && <span className="sona-file-name"><CheckCircle2 size={14}/>{pdfName}<button type="button" aria-label="Remove PDF" onClick={() => {setPdfName("");setSourceText("");setResult("");setQuiz(null);}}><X size={13}/></button></span>}<small>Text-based PDFs up to 80 pages. Scanned PDFs need OCR.</small></div>}
      {tool === "pdf" && <label>Ask a question about the document<div className="sona-question-row"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Explain the key concepts on page 3…" maxLength={1500}/><button type="button" className={voiceActive ? "voice-active" : ""} onClick={startVoice} title="Speak your question"><Mic size={17}/></button></div></label>}
      {tool === "quiz" && sourceText && <p className="sona-source-note"><BookOpen size={14}/> Questions will be grounded in {pdfName}.</p>}
      {error && <p className="sona-error" role="alert">{error}</p>}
      <button type="button" className="sona-generate" onClick={() => void runTool()} disabled={busy || (tool === "plan" && !topic.trim()) || (tool === "quiz" && !topic.trim() && !sourceText) || (tool === "pdf" && (!sourceText || !question.trim()))}>{busy ? <><LoaderCircle size={17} className="sona-spin"/> Working…</> : <><Sparkles size={17}/>{tool === "plan" ? "Generate my roadmap" : tool === "quiz" ? "Create 5-question quiz" : "Ask the PDF"}</>}</button>
    </div>
    {result && <div className="sona-result"><div className="sona-result-title"><CheckCircle2 size={17}/>{tool === "plan" ? "Your study roadmap" : "Answer from your PDF"}</div><pre>{result}</pre><button type="button" className="sona-copy" onClick={() => {void navigator.clipboard?.writeText(result);}}>Copy result</button></div>}
    {quiz && <div className="sona-result"><div className="sona-result-title"><CheckCircle2 size={17}/>{quiz.title || "Your practice quiz"}</div>{quiz.questions.map((q, i) => <fieldset className="sona-question" key={i}><legend>{i+1}. {q.question}</legend>{q.options.map((option, j) => <label key={j} className={submitted && j === q.answerIndex ? "correct-option" : ""}><input type="radio" name={"q"+i} checked={answers[i] === j} disabled={submitted} onChange={() => setAnswers((old) => ({...old,[i]:j}))}/>{option}</label>)}{submitted && <p className="sona-explanation">{answers[i] === q.answerIndex ? "Correct — " : "Review — "}{q.explanation}</p>}</fieldset>)}{!submitted ? <button type="button" className="sona-generate" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== quiz.questions.length}>Submit answers</button> : <p className="sona-score">Your score: {score} / {quiz.questions.length}</p>}</div>}
  </section>;
}
