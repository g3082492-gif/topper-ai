import * as pdfjs from 'pdfjs-dist'
import mammoth from 'mammoth'

// Set worker path for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`

export const processFile = async (file: File): Promise<string> => {
  const fileType = file.name.split('.').pop()?.toLowerCase()

  switch (fileType) {
    case 'pdf':
      return await extractTextFromPDF(file)
    case 'docx':
      return await extractTextFromDOCX(file)
    case 'txt':
      return await extractTextFromTXT(file)
    default:
      throw new Error('Unsupported file type')
  }
}

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    let fullText = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const strings = content.items.map((item: any) => item.str)
      fullText += strings.join(" ") + "\n"
    }

    if (!fullText.trim()) {
      throw new Error("PDF contains no readable text. It might be a scanned image.")
    }

    return fullText
  } catch (error: any) {
    console.error("PDF Extraction Error:", error)
    throw new Error(`Failed to read PDF: ${error.message}`)
  }
}

const extractTextFromDOCX = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

const extractTextFromTXT = async (file: File): Promise<string> => {
  return await file.text()
}
