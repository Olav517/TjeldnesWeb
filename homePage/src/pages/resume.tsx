import './resume.css'

function Resume() {
  return (
    <div className="pdf-container">
      <embed
        src="/your-resume.pdf"
        type="application/pdf"
        width="100%"
        height="100%"
      />
    </div>
  )
}

export default Resume