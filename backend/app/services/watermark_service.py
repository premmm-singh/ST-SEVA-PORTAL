import io
from datetime import datetime, timezone
from PIL import Image, ImageDraw, ImageFont
import pypdf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

class WatermarkService:
    """
    Feature 36:
    Dynamic real-time security watermarking for documents:
    'ST Seva Portal • For Verification Only • [Timestamp] • [User: {user_id}]'
    """

    @staticmethod
    def get_watermark_text(user_identifier: str = "Verified Applicant") -> str:
        now_str = datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M UTC")
        return f"ST Seva Portal • For Verification Only • {now_str} • {user_identifier}"

    @classmethod
    def watermark_image(cls, image_bytes: bytes, user_identifier: str = "Applicant") -> bytes:
        try:
            base_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            width, height = base_image.size
            
            # Create a transparent watermark layer
            watermark_layer = Image.new("RGBA", (width, height), (255, 255, 255, 0))
            draw = ImageDraw.Draw(watermark_layer)
            
            text = cls.get_watermark_text(user_identifier)
            font_size = max(18, min(width, height) // 25)
            try:
                font = ImageFont.load_default()
            except Exception:
                font = None
                
            # Draw diagonal banner
            # Semi-transparent red/gray watermark color
            text_color = (180, 20, 20, 75) # RGBA
            
            # Step diagonal stamps across the canvas
            step_y = max(100, height // 4)
            for y in range(50, height, step_y):
                draw.text((30, y), text, fill=text_color, font=font)
                
            # Composite images
            watermarked = Image.alpha_composite(base_image, watermark_layer)
            
            output = io.BytesIO()
            watermarked.convert("RGB").save(output, format="JPEG", quality=90)
            return output.getvalue()
        except Exception as e:
            # Fallback to returning original bytes if image format unsupported
            return image_bytes

    @classmethod
    def _create_pdf_watermark_layer(cls, page_width: float, page_height: float, text: str) -> bytes:
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=(page_width, page_height))
        can.setFont("Helvetica-Bold", 14)
        # Semi-transparent red
        can.setFillColor(Color(0.7, 0.1, 0.1, alpha=0.25))
        
        # Draw diagonal rotated watermark
        can.saveState()
        can.translate(page_width / 2, page_height / 2)
        can.rotate(45)
        can.drawCentredString(0, 0, text)
        can.drawCentredString(0, 100, text)
        can.drawCentredString(0, -100, text)
        can.restoreState()
        
        can.save()
        packet.seek(0)
        return packet.getvalue()

    @classmethod
    def watermark_pdf(cls, pdf_bytes: bytes, user_identifier: str = "Applicant") -> bytes:
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            writer = pypdf.PdfWriter()
            text = cls.get_watermark_text(user_identifier)
            
            for page in reader.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
                
                # Create single-page watermark PDF
                watermark_pdf_bytes = cls._create_pdf_watermark_layer(width, height, text)
                watermark_reader = pypdf.PdfReader(io.BytesIO(watermark_pdf_bytes))
                watermark_page = watermark_reader.pages[0]
                
                # Merge watermark into original page
                page.merge_page(watermark_page)
                writer.add_page(page)
                
            output = io.BytesIO()
            writer.write(output)
            return output.getvalue()
        except Exception:
            return pdf_bytes

    @classmethod
    def apply_watermark(cls, file_bytes: bytes, mime_type: str, user_identifier: str = "Applicant") -> bytes:
        """Applies dynamic watermark based on MIME type."""
        if "pdf" in mime_type.lower():
            return cls.watermark_pdf(file_bytes, user_identifier)
        elif any(img in mime_type.lower() for img in ["jpeg", "jpg", "png", "webp"]):
            return cls.watermark_image(file_bytes, user_identifier)
        return file_bytes
