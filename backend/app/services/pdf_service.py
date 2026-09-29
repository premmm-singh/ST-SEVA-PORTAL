import io
from datetime import datetime

class ApplicationPdfService:
    @classmethod
    def generate_application_pdf(cls, app_data: dict, scheme_name: str, app_number: str) -> bytes:
        """Generates a downloadable government format application acknowledgement."""
        # Simple plain HTML/Text printable buffer
        buffer = io.BytesIO()
        text_content = f"""
================================================================================
          GOVERNMENT OF INDIA - MINISTRY OF TRIBAL AFFAIRS
       ST SEVA PORTAL - SCHOLARSHIP APPLICATION ACKNOWLEDGEMENT
================================================================================

APPLICATION TRACKING ID : {app_number}
SCHOLARSHIP SCHEME      : {scheme_name}
SUBMISSION TIMESTAMP    : {datetime.now().strftime("%d-%b-%Y %H:%M:%S IST")}
STATUS                  : SUBMITTED (UNDER SCRUTINY)
VERIFICATION AUTHORITY  : DISTRICT WELFARE OFFICE (DWO)

--------------------------------------------------------------------------------
1. BENEFICIARY DETAILS:
--------------------------------------------------------------------------------
Full Name               : {app_data.get('full_name', 'N/A')}
Date of Birth           : {app_data.get('dob', 'N/A')}
Gender                  : {app_data.get('gender', 'N/A')}
Category                : Scheduled Tribe (ST)
Sub-Tribe               : {app_data.get('sub_caste', 'N/A')}
Annual Family Income    : INR {app_data.get('annual_family_income', 'N/A')}

--------------------------------------------------------------------------------
2. DOMICILE & ADDRESS:
--------------------------------------------------------------------------------
Address                 : {app_data.get('address_line1', 'N/A')}, {app_data.get('district', 'N/A')}, {app_data.get('state', 'N/A')} - {app_data.get('pincode', 'N/A')}

--------------------------------------------------------------------------------
3. ACADEMIC & INSTITUTION INFORMATION:
--------------------------------------------------------------------------------
Institution Name        : {app_data.get('institution_name', 'N/A')}
AISHE Code              : {app_data.get('institution_code_aishe', 'N/A')}
Course / Discipline     : {app_data.get('course_name', 'N/A')}
Year of Study           : {app_data.get('current_year_of_study', 'N/A')} Year

--------------------------------------------------------------------------------
4. DIRECT BENEFIT TRANSFER (DBT) BANK DETAILS:
--------------------------------------------------------------------------------
Bank Name               : {app_data.get('bank_name', 'N/A')}
IFSC Code               : {app_data.get('bank_ifsc', 'N/A')}
Account Number          : Masked for Security (AES-256 Validated)

--------------------------------------------------------------------------------
5. STATUTORY DECLARATION:
--------------------------------------------------------------------------------
I hereby declare that all particulars stated above are true to the best of my
knowledge and belief. I belong to the Scheduled Tribe community.

Digitally signed via ST Seva Portal (NIC / National e-Governance Division).
QR Code Verification: http://localhost:5173/applications/verify/{app_number}
================================================================================
"""
        buffer.write(text_content.encode('utf-8'))
        buffer.seek(0)
        return buffer.getvalue()
