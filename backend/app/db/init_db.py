from datetime import date, datetime, timezone
from app.db.session import engine, Base, SessionLocal
from app.db.models.user import User, UserRole
from app.db.models.profile import StudentProfile, OfficerProfile, AdminProfile
from app.db.models.security import MfaCredential, OtpVerification
from app.db.models.session import SessionModel, DeviceFingerprint, LoginActivity
from app.db.models.audit import AuditLog
from app.db.models.scheme import Scheme
from app.db.models.application import Application, ApplicationDraft, ApplicationTimeline
from app.db.models.document import Document
from app.db.models.institution import (
    InstitutionMaster,
    InstitutionProfile,
    InstitutionFeeStructure,
    InstitutionVerification
)
from app.core.security import hash_password
from app.core.crypto import encrypt_field, blind_index

def init_db():
    print("[DB-INIT] Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Super Admin
        admin_email = "admin@stseva.gov.in"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            print("[DB-INIT] Seeding Super Admin account...")
            admin_user = User(
                email=admin_email,
                hashed_password=hash_password("Admin@1234"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
                mobile_number_hash=blind_index("9999900001"),
                mobile_number_enc=encrypt_field("9999900001")
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            admin_profile = AdminProfile(
                user_id=admin_user.id,
                full_name="Dr. Arvind Munda (IAS)",
                admin_level="SUPER_ADMIN",
                jurisdiction="Ministry of Tribal Affairs, Shastri Bhawan, New Delhi",
                contact_email="admin@stseva.gov.in"
            )
            db.add(admin_profile)
            db.commit()

        # 2. District Welfare Officer (DWO) - officer@stseva.gov.in & officer.ranchi@stseva.gov.in
        officers_to_seed = [
            ("officer@stseva.gov.in", "JH-DWO-2018-001"),
            ("officer.ranchi@stseva.gov.in", "JH-DWO-2018-042")
        ]
        for off_email, emp_id in officers_to_seed:
            officer_user = db.query(User).filter(User.email == off_email).first()
            if not officer_user:
                print(f"[DB-INIT] Seeding District Welfare Officer account ({off_email})...")
                officer_user = User(
                    email=off_email,
                    hashed_password=hash_password("Officer@1234"),
                    role=UserRole.OFFICER,
                    is_active=True,
                    is_verified=True,
                    mobile_number_hash=blind_index("9876500002"),
                    mobile_number_enc=encrypt_field("9876500002")
                )
                db.add(officer_user)
                db.commit()
                db.refresh(officer_user)
            
            existing_profile = db.query(OfficerProfile).filter(OfficerProfile.user_id == officer_user.id).first()
            if not existing_profile:
                officer_profile = OfficerProfile(
                    user_id=officer_user.id,
                    full_name="Smt. Pratibha Soren",
                    designation="District Welfare Officer (DWO)",
                    department="Department of Scheduled Tribe & Minority Welfare",
                    state="Jharkhand",
                    district="Ranchi",
                    office_address="Collectorate Compound, Kutchery Road, Ranchi - 834001",
                    employee_id=emp_id,
                    assigned_schemes=["ST_POST_MATRIC", "NATIONAL_FELLOWSHIP_ST", "TOP_CLASS_EDUCATION_ST"]
                )
                db.add(officer_profile)
                db.commit()

        # 3. Demo ST Student
        student_email = "student@stseva.gov.in"
        student_mobile = "9876543210"
        student_user = db.query(User).filter(User.email == student_email).first()
        if not student_user:
            print("[DB-INIT] Seeding Demo ST Student account...")
            student_user = User(
                email=student_email,
                hashed_password=hash_password("Student@2026#Gov"),
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True,
                mobile_number_hash=blind_index(student_mobile),
                mobile_number_enc=encrypt_field(student_mobile),
                aadhaar_hash=blind_index("987654321098"),
                aadhaar_enc=encrypt_field("987654321098")
            )
            db.add(student_user)
            db.commit()
            db.refresh(student_user)
            
            student_profile = StudentProfile(
                user_id=student_user.id,
                full_name="Birsa Munda Jr.",
                dob=date(2003, 11, 15),
                gender="Male",
                category="Scheduled Tribe (ST)",
                sub_caste="Munda",
                father_name="Somra Munda",
                mother_name="Budhni Mundain",
                annual_family_income=120000.00,
                address_line1="Gram Ulihatu, Post Khunti",
                district="Khunti",
                state="Jharkhand",
                pincode="835210",
                bank_name="State Bank of India",
                bank_account_enc=encrypt_field("30491827465"),
                bank_ifsc="SBIN0000118",
                bank_branch="Khunti Main Branch",
                institution_name="Birsa Institute of Technology (BIT) Sindri",
                institution_code_aishe="C-44281",
                course_name="B.Tech Computer Science & Engineering",
                current_year_of_study=3
            )
            db.add(student_profile)
            db.commit()

        # 4. Official Ministry of Tribal Affairs (MoTA) Schemes Seeding
        schemes_data = [
            {
                "id": "ST_POST_MATRIC",
                "scheme_name": "Post-Matric Scholarship Scheme for ST Students",
                "scheme_code": "MTA-PMS-2026",
                "scheme_type": "CENTRALLY_SPONSORED",
                "education_level": "COLLEGE",
                "financial_assistance_details": "100% compulsory non-refundable fees reimbursement + monthly maintenance allowance up to ₹1,200/month for day scholars and ₹1,400/month for hostellers.",
                "max_family_income": 250000.00,
                "academic_year": "2026-2027",
                "application_start_date": date(2026, 1, 1),
                "application_deadline": date(2026, 11, 30),
                "guidelines_url": "https://tribal.nic.in/pms-guidelines.pdf"
            },
            {
                "id": "ST_PRE_MATRIC",
                "scheme_name": "Pre-Matric Scholarship Scheme for ST Students (Class IX & X)",
                "scheme_code": "MTA-PRE-2026",
                "scheme_type": "CENTRALLY_SPONSORED",
                "education_level": "SECONDARY",
                "financial_assistance_details": "Day scholars: ₹3,500/year; Hostellers: ₹7,000/year + annual books & stationery grant.",
                "max_family_income": 250000.00,
                "academic_year": "2026-2027",
                "application_start_date": date(2026, 1, 1),
                "application_deadline": date(2026, 10, 31),
                "guidelines_url": "https://tribal.nic.in/pre-matric.pdf"
            },
            {
                "id": "NATIONAL_FELLOWSHIP_ST",
                "scheme_name": "National Fellowship and Scholarship for Higher Education of ST Students",
                "scheme_code": "MTA-NFST-2026",
                "scheme_type": "CENTRAL_SECTOR",
                "education_level": "RESEARCH",
                "financial_assistance_details": "JRF: ₹37,000/month + HRA; SRF: ₹42,000/month + HRA + contingency grant of ₹20,500/year for Humanities and ₹25,000/year for Science.",
                "max_family_income": None, # Merit based
                "academic_year": "2026-2027",
                "application_start_date": date(2026, 2, 1),
                "application_deadline": date(2026, 12, 15),
                "guidelines_url": "https://fellowship.tribal.gov.in"
            },
            {
                "id": "TOP_CLASS_EDUCATION_ST",
                "scheme_name": "National Overseas Scholarship (NOS) for Scheduled Tribe Candidates",
                "scheme_code": "MTA-NOS-2026",
                "scheme_type": "CENTRAL_SECTOR",
                "education_level": "RESEARCH",
                "financial_assistance_details": "Full foreign tuition fees, return economy airfare, medical insurance, and annual living allowance of £9,900 / $15,400.",
                "max_family_income": 600000.00,
                "academic_year": "2026-2027",
                "application_start_date": date(2026, 1, 15),
                "application_deadline": date(2026, 12, 31),
                "guidelines_url": "https://nosmsje.gov.in"
            }
        ]

        for s in schemes_data:
            existing_scheme = db.query(Scheme).filter(Scheme.id == s["id"]).first()
            if not existing_scheme:
                print(f"[DB-INIT] Seeding Scheme: {s['scheme_name']}")
                db.add(Scheme(**s))
        db.commit()

        # 5. Seed a demo submitted application with timeline events
        if student_user:
            demo_app_num = "ST-2026-A83F19"
            existing_app = db.query(Application).filter(Application.application_number == demo_app_num).first()
            if not existing_app:
                print(f"[DB-INIT] Seeding demo application {demo_app_num}...")
                app = Application(
                    application_number=demo_app_num,
                    student_id=student_user.id,
                    scheme_id="ST_POST_MATRIC",
                    academic_year="2026-2027",
                    status="UNDER_SCRUTINY",
                    is_locked=True,
                    submission_date=datetime.now(timezone.utc),
                    application_data={
                        "full_name": "Birsa Munda Jr.",
                        "dob": "2003-11-15",
                        "gender": "Male",
                        "category": "Scheduled Tribe (ST)",
                        "sub_caste": "Munda",
                        "annual_family_income": 120000.00,
                        "address_line1": "Gram Ulihatu, Post Khunti",
                        "district": "Khunti",
                        "state": "Jharkhand",
                        "pincode": "835210",
                        "institution_name": "Birsa Institute of Technology (BIT) Sindri",
                        "institution_code_aishe": "C-44281",
                        "course_name": "B.Tech Computer Science & Engineering",
                        "current_year_of_study": 3,
                        "bank_name": "State Bank of India",
                        "bank_ifsc": "SBIN0000118"
                    }
                )
                db.add(app)
                db.commit()
                db.refresh(app)

                # Seed Timeline events
                t1 = ApplicationTimeline(
                    application_id=app.id,
                    stage="APPLICATION_SUBMITTED",
                    title="Application Successfully Submitted",
                    description="Online form submitted via ST Seva Portal.",
                    actor_role="STUDENT"
                )
                t2 = ApplicationTimeline(
                    application_id=app.id,
                    stage="INSTITUTE_VERIFIED",
                    title="Verified by Head of Institution",
                    description="AISHE Institute C-44281 (BIT Sindri) validated course enrollment and regular attendance.",
                    actor_role="INSTITUTION"
                )
                t3 = ApplicationTimeline(
                    application_id=app.id,
                    stage="UNDER_SCRUTINY",
                    title="Under Scrutiny by District Welfare Officer",
                    description="Application forwarded to District Welfare Officer (DWO Ranchi/Khunti) for caste and income verification.",
                    actor_role="WELFARE_OFFICER"
                )
                db.add_all([t1, t2, t3])
                db.commit()

        # 4. Phase 4: Seed Accredited Institutions into InstitutionMaster
        institutions_data = [
            {
                "aishe_code": "C-44281",
                "udise_code": None,
                "name": "Birsa Institute of Technology (BIT) Sindri",
                "institution_type": "Government Engineering College",
                "affiliated_university": "Jharkhand University of Technology (JUT), Ranchi",
                "state": "Jharkhand",
                "district": "Dhanbad",
                "address": "PO Sindri Institute, Dhanbad - 828123",
                "pincode": "828123"
            },
            {
                "aishe_code": "C-44312",
                "udise_code": None,
                "name": "St. Xavier's College Ranchi",
                "institution_type": "Autonomous College",
                "affiliated_university": "Ranchi University",
                "state": "Jharkhand",
                "district": "Ranchi",
                "address": "Post Box No. 9, Dr. Camil Bulcke Path, Ranchi - 834001",
                "pincode": "834001"
            },
            {
                "aishe_code": "U-0205",
                "udise_code": None,
                "name": "Central University of Jharkhand (CUJ)",
                "institution_type": "Central University",
                "affiliated_university": "Central University of Jharkhand",
                "state": "Jharkhand",
                "district": "Ranchi",
                "address": "Cheri-Manatu, Kanke, Ranchi - 835222",
                "pincode": "835222"
            },
            {
                "aishe_code": "C-44298",
                "udise_code": None,
                "name": "National Institute of Technology (NIT) Jamshedpur",
                "institution_type": "Institute of National Importance",
                "affiliated_university": "Autonomous NIT",
                "state": "Jharkhand",
                "district": "East Singhbhum",
                "address": "Adityapur, Jamshedpur - 831014",
                "pincode": "831014"
            },
            {
                "aishe_code": "SCH-JH-200701",
                "udise_code": "20070100101",
                "name": "Govt. ST Residential Higher Secondary School Khunti",
                "institution_type": "Government Higher Secondary School",
                "affiliated_university": "Jharkhand Academic Council (JAC)",
                "state": "Jharkhand",
                "district": "Khunti",
                "address": "Near Block Office, Khunti - 835210",
                "pincode": "835210"
            }
        ]

        for inst in institutions_data:
            existing_inst = db.query(InstitutionMaster).filter(InstitutionMaster.aishe_code == inst["aishe_code"]).first()
            if not existing_inst:
                db.add(InstitutionMaster(**inst))
        db.commit()

        # 5. Seed Institutional Nodal Officer (INO) for BIT Sindri
        ino_email = "ino.bitsindri@stseva.gov.in"
        ino_user = db.query(User).filter(User.email == ino_email).first()
        if not ino_user:
            print("[DB-INIT] Seeding Institutional Nodal Officer (BIT Sindri)...")
            ino_user = User(
                email=ino_email,
                hashed_password=hash_password("Institute@2026#Gov"),
                role=UserRole.INSTITUTION,
                is_active=True,
                is_verified=True,
                mobile_number_hash=blind_index("9876500003"),
                mobile_number_enc=encrypt_field("9876500003")
            )
            db.add(ino_user)
            db.commit()
            db.refresh(ino_user)

            ino_profile = InstitutionProfile(
                user_id=ino_user.id,
                aishe_code="C-44281",
                nodal_officer_name="Prof. Rajeshwar Soren",
                nodal_officer_designation="Associate Professor & Institutional Nodal Officer",
                official_email=ino_email,
                contact_mobile="9876500003",
                verification_status="APPROVED"
            )
            db.add(ino_profile)
            db.commit()
            db.refresh(ino_profile)

            # Seed standard approved fee structures for BIT Sindri
            cse_fee = InstitutionFeeStructure(
                institution_id=ino_profile.id,
                course_name="B.Tech Computer Science & Engineering",
                academic_year="2026-2027",
                tuition_fee=35000.0,
                admission_fee=2500.0,
                exam_fee=3000.0,
                library_fee=1500.0,
                hostel_fee=12000.0,
                total_annual_fee=54000.0
            )
            mech_fee = InstitutionFeeStructure(
                institution_id=ino_profile.id,
                course_name="B.Tech Mechanical Engineering",
                academic_year="2026-2027",
                tuition_fee=35000.0,
                admission_fee=2500.0,
                exam_fee=3000.0,
                library_fee=1500.0,
                hostel_fee=12000.0,
                total_annual_fee=54000.0
            )
            db.add_all([cse_fee, mech_fee])
            db.commit()

        print("[DB-INIT] Phase 2, 3, and 4 database structures initialized successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
