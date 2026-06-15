from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def generate_pdf():
    pdf_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter
    
    # Page 1
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 80, "Introduction to Relational Databases")
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 120, "1. What is a Database?")
    c.setFont("Helvetica", 12)
    text = (
        "A database is an organized collection of structured information, or data, typically "
        "stored electronically in a computer system. A database is usually controlled by a "
        "database management system (DBMS). Together, the data and the DBMS, along with the "
        "applications that are associated with them, are referred to as a database system, "
        "often shortened to just database."
    )
    textobj = c.beginText(50, height - 150)
    textobj.setFont("Helvetica", 11)
    textobj.setLeading(14)
    textobj.textLines(text)
    c.drawText(textobj)
    
    # Concepts
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 250, "2. Key Relational Concepts")
    
    concepts = [
        "Primary Key: A primary key is a specific choice of a minimal set of attributes (columns) that uniquely specifies a tuple (row) in a relation.",
        "Foreign Key: A foreign key is a field (or collection of fields) in one table, that uniquely identifies a row of another table.",
        "Normalization: Normalization is the process of organizing data in a database. This includes creating tables and establishing relationships between those tables according to rules designed both to protect the data and to make the database more flexible.",
        "SQL: Structured Query Language (SQL) is a standardized programming language that is used to manage relational databases and perform various operations on the data in them."
    ]
    
    y = height - 280
    for concept in concepts:
        textobj = c.beginText(50, y)
        textobj.setFont("Helvetica", 11)
        textobj.setLeading(14)
        textobj.textLines(concept)
        c.drawText(textobj)
        y -= 50
        
    c.showPage()
    c.save()
    print(f"PDF generated successfully at: {pdf_path}")

if __name__ == "__main__":
    generate_pdf()
