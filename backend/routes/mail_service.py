"""
Gmail SMTP Mail Service
Mail konfigürasyonu ve şablon yönetimi
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
import re
import os

router = APIRouter(prefix="/api/mail", tags=["Mail"])

# ============ MODELS ============

class MailConfig(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str  # Gmail adresi
    smtp_password: str  # Gmail App Password
    sender_name: str = "Yönetioo"
    sender_email: str  # Gönderen email
    is_active: bool = True

class MailConfigUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    is_active: Optional[bool] = None

class MailTemplate(BaseModel):
    id: Optional[str] = None
    name: str  # Template adı (örn: "welcome", "password_reset")
    subject: str  # Mail konusu
    body_html: str  # HTML içerik
    body_text: Optional[str] = None  # Plain text alternatif
    variables: List[str] = []  # Kullanılan değişkenler
    description: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MailTemplateCreate(BaseModel):
    name: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    variables: List[str] = []
    description: Optional[str] = None
    is_active: bool = True

class MailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    variables: Optional[List[str]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SendMailRequest(BaseModel):
    to: List[str]  # Alıcı email adresleri
    template_name: str  # Kullanılacak şablon adı
    variables: Dict[str, Any] = {}  # Şablonda kullanılacak değişkenler
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None

class SendDirectMailRequest(BaseModel):
    to: List[str]
    subject: str
    body_html: str
    body_text: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None

class TestMailRequest(BaseModel):
    to_email: str

# ============ MAIL SERVICE ============

class MailService:
    def __init__(self, db):
        self.db = db
    
    async def get_config(self) -> Optional[dict]:
        """Mail konfigürasyonunu getir"""
        config = await self.db.mail_config.find_one({"_id": "main"}, {"_id": 0})
        return config
    
    async def save_config(self, config: MailConfig) -> dict:
        """Mail konfigürasyonunu kaydet"""
        config_dict = config.model_dump()
        config_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.db.mail_config.update_one(
            {"_id": "main"},
            {"$set": config_dict},
            upsert=True
        )
        return config_dict
    
    async def update_config(self, update_data: MailConfigUpdate) -> dict:
        """Mail konfigürasyonunu güncelle"""
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.db.mail_config.update_one(
            {"_id": "main"},
            {"$set": update_dict},
            upsert=True
        )
        
        return await self.get_config()
    
    def replace_variables(self, text: str, variables: Dict[str, Any]) -> str:
        """Şablondaki değişkenleri değerlerle değiştir"""
        for key, value in variables.items():
            text = text.replace(f"{{{{{key}}}}}", str(value))
            text = text.replace(f"{{{{ {key} }}}}", str(value))
        return text
    
    async def send_mail(
        self,
        to: List[str],
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> dict:
        """Email gönder"""
        config = await self.get_config()
        
        if not config or not config.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Mail servisi aktif değil. Lütfen mail ayarlarını yapılandırın."
            )
        
        try:
            # MIME mesajı oluştur
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{config['sender_name']} <{config['sender_email']}>"
            message["To"] = ", ".join(to)
            
            if cc:
                message["Cc"] = ", ".join(cc)
            
            # Plain text ve HTML ekle
            if body_text:
                part1 = MIMEText(body_text, "plain", "utf-8")
                message.attach(part1)
            
            part2 = MIMEText(body_html, "html", "utf-8")
            message.attach(part2)
            
            # Tüm alıcılar
            all_recipients = to.copy()
            if cc:
                all_recipients.extend(cc)
            if bcc:
                all_recipients.extend(bcc)
            
            # SMTP bağlantısı
            context = ssl.create_default_context()
            
            with smtplib.SMTP(config["smtp_host"], config["smtp_port"]) as server:
                server.starttls(context=context)
                server.login(config["smtp_user"], config["smtp_password"])
                server.sendmail(
                    config["sender_email"],
                    all_recipients,
                    message.as_string()
                )
            
            # Log kaydı
            await self.db.mail_logs.insert_one({
                "id": str(uuid.uuid4()),
                "to": to,
                "cc": cc,
                "bcc": bcc,
                "subject": subject,
                "status": "sent",
                "sent_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {"success": True, "message": "Email başarıyla gönderildi"}
            
        except smtplib.SMTPAuthenticationError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Gmail kimlik doğrulama hatası. Lütfen App Password'ü kontrol edin."
            )
        except Exception as e:
            # Hata logla
            await self.db.mail_logs.insert_one({
                "id": str(uuid.uuid4()),
                "to": to,
                "subject": subject,
                "status": "failed",
                "error": str(e),
                "sent_at": datetime.now(timezone.utc).isoformat()
            })
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Email gönderilemedi: {str(e)}"
            )
    
    async def send_with_template(
        self,
        to: List[str],
        template_name: str,
        variables: Dict[str, Any],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> dict:
        """Şablon kullanarak email gönder"""
        # Şablonu bul
        template = await self.db.mail_templates.find_one(
            {"name": template_name, "is_active": True},
            {"_id": 0}
        )
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"'{template_name}' şablonu bulunamadı"
            )
        
        # Değişkenleri değiştir
        subject = self.replace_variables(template["subject"], variables)
        body_html = self.replace_variables(template["body_html"], variables)
        body_text = None
        if template.get("body_text"):
            body_text = self.replace_variables(template["body_text"], variables)
        
        return await self.send_mail(to, subject, body_html, body_text, cc, bcc)


# ============ ROUTES ============

def get_mail_routes(db):
    """Mail route'larını oluştur"""
    
    mail_service = MailService(db)
    
    # --- Config Routes ---
    
    @router.get("/config")
    async def get_mail_config():
        """Mail konfigürasyonunu getir"""
        config = await mail_service.get_config()
        if config:
            # Şifreyi maskele
            if config.get("smtp_password"):
                config["smtp_password"] = "••••••••"
        return config or {}
    
    @router.post("/config")
    async def save_mail_config(config: MailConfig):
        """Mail konfigürasyonunu kaydet"""
        return await mail_service.save_config(config)
    
    @router.put("/config")
    async def update_mail_config(update_data: MailConfigUpdate):
        """Mail konfigürasyonunu güncelle"""
        return await mail_service.update_config(update_data)
    
    @router.post("/config/test")
    async def test_mail_config(request: TestMailRequest):
        """Mail konfigürasyonunu test et"""
        test_html = """
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #7C3AED;">🎉 Test Başarılı!</h2>
            <p>Yönetioo mail servisi düzgün çalışıyor.</p>
            <p style="color: #666;">Bu bir test emailidir.</p>
        </body>
        </html>
        """
        return await mail_service.send_mail(
            to=[request.to_email],
            subject="Yönetioo - Mail Testi",
            body_html=test_html,
            body_text="Yönetioo mail servisi düzgün çalışıyor. Bu bir test emailidir."
        )
    
    # --- Template Routes ---
    
    @router.get("/templates")
    async def get_mail_templates():
        """Tüm mail şablonlarını getir"""
        templates = await db.mail_templates.find({}, {"_id": 0}).to_list(100)
        return templates
    
    @router.get("/templates/{template_id}")
    async def get_mail_template(template_id: str):
        """Tek bir şablonu getir"""
        template = await db.mail_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        return template
    
    @router.post("/templates")
    async def create_mail_template(template: MailTemplateCreate):
        """Yeni mail şablonu oluştur"""
        # Aynı isimde şablon var mı kontrol et
        existing = await db.mail_templates.find_one({"name": template.name})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{template.name}' adında bir şablon zaten mevcut"
            )
        
        template_dict = template.model_dump()
        template_dict["id"] = str(uuid.uuid4())
        template_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        template_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.mail_templates.insert_one(template_dict)
        
        return {k: v for k, v in template_dict.items() if k != "_id"}
    
    @router.put("/templates/{template_id}")
    async def update_mail_template(template_id: str, update_data: MailTemplateUpdate):
        """Mail şablonunu güncelle"""
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.mail_templates.update_one(
            {"id": template_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        
        return await db.mail_templates.find_one({"id": template_id}, {"_id": 0})
    
    @router.delete("/templates/{template_id}")
    async def delete_mail_template(template_id: str):
        """Mail şablonunu sil"""
        result = await db.mail_templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Şablon bulunamadı")
        return {"message": "Şablon silindi"}
    
    # --- Send Mail Routes ---
    
    @router.post("/send")
    async def send_mail_with_template(request: SendMailRequest):
        """Şablon kullanarak mail gönder"""
        return await mail_service.send_with_template(
            to=request.to,
            template_name=request.template_name,
            variables=request.variables,
            cc=request.cc,
            bcc=request.bcc
        )
    
    @router.post("/send-direct")
    async def send_direct_mail(request: SendDirectMailRequest):
        """Direkt mail gönder (şablon kullanmadan)"""
        return await mail_service.send_mail(
            to=request.to,
            subject=request.subject,
            body_html=request.body_html,
            body_text=request.body_text,
            cc=request.cc,
            bcc=request.bcc
        )
    
    # --- Mail Logs ---
    
    @router.get("/logs")
    async def get_mail_logs(limit: int = 50):
        """Mail loglarını getir"""
        logs = await db.mail_logs.find(
            {}, 
            {"_id": 0}
        ).sort("sent_at", -1).to_list(limit)
        return logs
    
    # --- Seed Default Templates ---
    
    @router.post("/templates/seed-defaults")
    async def seed_default_templates():
        """Varsayılan şablonları ekle"""
        default_templates = [
            {
                "id": str(uuid.uuid4()),
                "name": "welcome",
                "subject": "Yönetioo'ya Hoş Geldiniz! 🏠",
                "description": "Yeni kayıt olan kullanıcılara gönderilir",
                "variables": ["user_name", "building_name", "login_url"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.6; }
        .button { display: inline-block; background: #7C3AED; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #6D28D9; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
        .info-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-box p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Yönetioo</h1>
        </div>
        <div class="content">
            <h2>Hoş Geldiniz, {{user_name}}! 👋</h2>
            <p>{{building_name}} bina yönetim sistemine başarıyla kaydoldunuz.</p>
            <p>Artık aşağıdaki özellikleri kullanabilirsiniz:</p>
            <ul style="color: #4b5563;">
                <li>📢 Bina duyurularını görüntüleme</li>
                <li>💰 Aidat ödemelerinizi takip etme</li>
                <li>📝 Talep ve şikayet oluşturma</li>
                <li>📊 Finansal raporları inceleme</li>
            </ul>
            <div style="text-align: center;">
                <a href="{{login_url}}" class="button">Giriş Yap</a>
            </div>
        </div>
        <div class="footer">
            <p>Bu email {{building_name}} tarafından gönderilmiştir.</p>
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Hoş Geldiniz {{user_name}}! {{building_name}} bina yönetim sistemine başarıyla kaydoldunuz. Giriş yapmak için: {{login_url}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "password_reset",
                "subject": "Şifre Sıfırlama Talebi 🔐",
                "description": "Şifre sıfırlama talebi yapan kullanıcılara gönderilir",
                "variables": ["user_name", "reset_link", "expire_time"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.6; }
        .button { display: inline-block; background: #EF4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin: 20px 0; color: #92400E; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Şifre Sıfırlama</h1>
        </div>
        <div class="content">
            <h2>Merhaba, {{user_name}}</h2>
            <p>Hesabınız için şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <div style="text-align: center;">
                <a href="{{reset_link}}" class="button">Şifremi Sıfırla</a>
            </div>
            <div class="warning">
                ⚠️ Bu bağlantı {{expire_time}} içinde geçerliliğini yitirecektir.
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz. Hesabınız güvende.</p>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Merhaba {{user_name}}, Şifrenizi sıfırlamak için: {{reset_link}} - Bu bağlantı {{expire_time}} içinde geçerliliğini yitirecektir.",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "announcement",
                "subject": "📢 {{building_name}} - {{announcement_title}}",
                "description": "Bina duyuruları için kullanılır",
                "variables": ["user_name", "building_name", "announcement_title", "announcement_content", "announcement_date"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.6; }
        .announcement-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .date { color: #6b7280; font-size: 14px; margin-bottom: 10px; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 Yeni Duyuru</h1>
        </div>
        <div class="content">
            <p class="date">{{announcement_date}}</p>
            <h2>{{announcement_title}}</h2>
            <div class="announcement-box">
                <p>Sayın {{user_name}},</p>
                <p>{{announcement_content}}</p>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Bu duyuru {{building_name}} yönetimi tarafından gönderilmiştir.</p>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "{{building_name}} - {{announcement_title}}\n\nSayın {{user_name}},\n\n{{announcement_content}}\n\nTarih: {{announcement_date}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "payment_reminder",
                "subject": "💰 Aidat Hatırlatması - {{month}}",
                "description": "Aidat ödeme hatırlatması",
                "variables": ["user_name", "building_name", "month", "amount", "due_date", "payment_link"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.6; }
        .amount-box { background: #ECFDF5; border: 2px solid #10B981; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
        .amount { font-size: 36px; font-weight: bold; color: #059669; }
        .button { display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Aidat Hatırlatması</h1>
        </div>
        <div class="content">
            <h2>Sayın {{user_name}},</h2>
            <p>{{building_name}} için {{month}} ayı aidat ödemenizi hatırlatmak isteriz.</p>
            <div class="amount-box">
                <p style="margin: 0; color: #6b7280;">Ödenecek Tutar</p>
                <p class="amount">{{amount}}</p>
                <p style="margin: 0; color: #6b7280;">Son Ödeme: {{due_date}}</p>
            </div>
            <div style="text-align: center;">
                <a href="{{payment_link}}" class="button">Ödeme Yap</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Sayın {{user_name}}, {{building_name}} için {{month}} ayı aidat ödemenizi hatırlatırız. Tutar: {{amount}} - Son Ödeme: {{due_date}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "request_status",
                "subject": "📝 Talep Durumu Güncellendi - #{{request_id}}",
                "description": "Talep durumu değiştiğinde gönderilir",
                "variables": ["user_name", "request_id", "request_title", "old_status", "new_status", "admin_note"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.6; }
        .status-change { display: flex; align-items: center; justify-content: center; gap: 20px; margin: 30px 0; }
        .status { padding: 10px 20px; border-radius: 20px; font-weight: 600; }
        .status.old { background: #FEE2E2; color: #991B1B; }
        .status.new { background: #D1FAE5; color: #065F46; }
        .arrow { font-size: 24px; color: #9CA3AF; }
        .note-box { background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Talep Güncellendi</h1>
        </div>
        <div class="content">
            <h2>Sayın {{user_name}},</h2>
            <p><strong>#{{request_id}}</strong> numaralı talebinizin durumu güncellendi.</p>
            <p><strong>Talep:</strong> {{request_title}}</p>
            <div class="status-change">
                <span class="status old">{{old_status}}</span>
                <span class="arrow">→</span>
                <span class="status new">{{new_status}}</span>
            </div>
            <div class="note-box">
                <p style="margin: 0; color: #374151;"><strong>Yönetici Notu:</strong></p>
                <p style="margin: 10px 0 0 0;">{{admin_note}}</p>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Sayın {{user_name}}, #{{request_id}} numaralı talebiniz güncellendi. Eski Durum: {{old_status}} -> Yeni Durum: {{new_status}}. Not: {{admin_note}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # ===== YENİ ŞABLONLAR =====
            # 1. Superadmin'e yeni kayıt bildirimi
            {
                "id": str(uuid.uuid4()),
                "name": "new_registration_admin",
                "subject": "🆕 Yeni Bina Kaydı - {{building_name}}",
                "description": "Landing page'den yeni kayıt olunduğunda superadmin'e gönderilir",
                "variables": ["building_name", "manager_name", "manager_email", "manager_phone", "address", "apartment_count", "registration_date"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .info-table td:first-child { color: #6b7280; width: 40%; }
        .info-table td:last-child { color: #1f2937; font-weight: 500; }
        .button { display: inline-block; background: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🆕 Yeni Bina Kaydı</h1>
        </div>
        <div class="content">
            <p style="color: #4b5563;">Yeni bir bina yönetici kaydı alındı. Detaylar aşağıdadır:</p>
            <table class="info-table">
                <tr><td>Bina/Site Adı</td><td>{{building_name}}</td></tr>
                <tr><td>Yönetici Adı</td><td>{{manager_name}}</td></tr>
                <tr><td>E-posta</td><td>{{manager_email}}</td></tr>
                <tr><td>Telefon</td><td>{{manager_phone}}</td></tr>
                <tr><td>Adres</td><td>{{address}}</td></tr>
                <tr><td>Daire Sayısı</td><td>{{apartment_count}}</td></tr>
                <tr><td>Kayıt Tarihi</td><td>{{registration_date}}</td></tr>
            </table>
            <div style="text-align: center;">
                <a href="https://admin.yonetioo.com/registration-requests" class="button">Başvuruları İncele</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Superadmin Paneli</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Yeni bina kaydı: {{building_name}} - Yönetici: {{manager_name}} ({{manager_email}}) - Daire: {{apartment_count}} - Tarih: {{registration_date}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # 2. Yeni kayıt yapan yöneticiye hoşgeldin maili
            {
                "id": str(uuid.uuid4()),
                "name": "manager_welcome",
                "subject": "🏠 Yönetioo'ya Hoş Geldiniz - Başvurunuz Alındı!",
                "description": "Yeni kayıt olan bina yöneticisine gönderilir",
                "variables": ["manager_name", "building_name", "registration_date"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.6; }
        .steps { background: #f3f4f6; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .step { display: flex; align-items: flex-start; margin-bottom: 15px; }
        .step-number { background: #7C3AED; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
        .step-content { flex: 1; }
        .step-title { font-weight: 600; color: #1f2937; }
        .step-desc { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Yönetioo</h1>
        </div>
        <div class="content">
            <h2>Hoş Geldiniz, {{manager_name}}! 👋</h2>
            <p><strong>{{building_name}}</strong> için yönetici başvurunuz başarıyla alındı.</p>
            <p>Başvuru Tarihi: <strong>{{registration_date}}</strong></p>
            
            <div class="steps">
                <h3 style="margin-top: 0; color: #1f2937;">Sonraki Adımlar</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <div class="step-title">Başvuru İnceleme</div>
                        <div class="step-desc">Ekibimiz başvurunuzu 24 saat içinde inceleyecektir.</div>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <div class="step-title">Hesap Aktivasyonu</div>
                        <div class="step-desc">Onay sonrası giriş bilgileriniz e-posta ile iletilecektir.</div>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <div class="step-title">Sistemi Kullanmaya Başlayın</div>
                        <div class="step-desc">14 günlük ücretsiz deneme süreniz başlayacaktır.</div>
                    </div>
                </div>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px;">Sorularınız için <a href="mailto:destek@yonetioo.com" style="color: #7C3AED;">destek@yonetioo.com</a> adresinden bize ulaşabilirsiniz.</p>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Hoş Geldiniz {{manager_name}}! {{building_name}} için başvurunuz alındı. Ekibimiz 24 saat içinde inceleyecektir.",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # 3. Abonelik ödeme hatırlatması (Superadmin -> Bina Yöneticisi)
            {
                "id": str(uuid.uuid4()),
                "name": "subscription_reminder",
                "subject": "💳 Abonelik Ödeme Hatırlatması - {{month}}",
                "description": "Aylık abonelik ödemesi için bina yöneticilerine gönderilir",
                "variables": ["manager_name", "building_name", "month", "amount", "due_date", "plan_name", "payment_link"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .amount-box { background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 2px solid #6366F1; border-radius: 16px; padding: 30px; margin: 25px 0; text-align: center; }
        .amount { font-size: 42px; font-weight: bold; color: #4F46E5; }
        .plan-badge { display: inline-block; background: #6366F1; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 15px; }
        .button { display: inline-block; background: #6366F1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Abonelik Hatırlatması</h1>
        </div>
        <div class="content">
            <p style="color: #4b5563;">Sayın {{manager_name}},</p>
            <p style="color: #4b5563;"><strong>{{building_name}}</strong> için {{month}} ayı abonelik ödemenizi hatırlatmak isteriz.</p>
            
            <div class="amount-box">
                <span class="plan-badge">{{plan_name}}</span>
                <p class="amount">{{amount}}</p>
                <p style="margin: 0; color: #6b7280;">Son Ödeme Tarihi: <strong>{{due_date}}</strong></p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{payment_link}}" class="button">Ödeme Yap</a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
                ⚠️ Ödemenin son tarihe kadar yapılmaması durumunda hizmet kesintisi yaşanabilir.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Sayın {{manager_name}}, {{building_name}} için {{month}} ayı abonelik ödemesi: {{amount}} - Son Ödeme: {{due_date}} - Plan: {{plan_name}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # 4. Aidat bildirimi (Bina Yönetici -> Sakinler) - Harcama detaylı
            {
                "id": str(uuid.uuid4()),
                "name": "dues_notification",
                "subject": "🏠 {{month}} Ayı Aidat Bildirimi - {{building_name}}",
                "description": "Aylık aidat bildirimi, harcama detayları ile birlikte sakinlere gönderilir",
                "variables": ["user_name", "building_name", "month", "amount", "due_date", "expense_details", "apartment_no", "previous_balance", "total_amount"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .apartment-badge { display: inline-block; background: #D1FAE5; color: #065F46; padding: 8px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 20px; }
        .expense-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .expense-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; }
        .expense-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
        .expense-table tr:last-child td { border-bottom: none; }
        .total-box { background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 2px solid #10B981; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-amount { font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin-top: 15px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Aidat Bildirimi</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">{{month}}</p>
        </div>
        <div class="content">
            <span class="apartment-badge">Daire {{apartment_no}}</span>
            <p style="color: #4b5563;">Sayın {{user_name}},</p>
            <p style="color: #4b5563;"><strong>{{building_name}}</strong> için {{month}} ayı aidat detaylarınız aşağıdadır.</p>
            
            <h3 style="color: #1f2937; margin-top: 30px;">📋 Harcama Detayları</h3>
            <table class="expense-table">
                <thead>
                    <tr>
                        <th>Açıklama</th>
                        <th style="text-align: right;">Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    {{expense_details}}
                </tbody>
            </table>
            
            <div class="total-box">
                <div class="total-row">
                    <span style="color: #6b7280;">Bu Ay Aidat</span>
                    <span style="color: #1f2937; font-weight: 600;">{{amount}}</span>
                </div>
                <div class="total-row">
                    <span style="color: #6b7280;">Önceki Bakiye</span>
                    <span style="color: #1f2937; font-weight: 600;">{{previous_balance}}</span>
                </div>
                <hr style="border: none; border-top: 2px solid #10B981; margin: 15px 0;">
                <div class="total-amount">{{total_amount}}</div>
                <p style="text-align: center; color: #6b7280; margin: 10px 0 0 0;">Son Ödeme: {{due_date}}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="#" class="button">Ödeme Yap</a>
            </div>
        </div>
        <div class="footer">
            <p>Bu bildirim {{building_name}} yönetimi tarafından gönderilmiştir.</p>
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Sayın {{user_name}}, {{building_name}} Daire {{apartment_no}} için {{month}} ayı aidat tutarı: {{total_amount}} - Son Ödeme: {{due_date}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # 5. Toplantı/Oylama bildirimi
            {
                "id": str(uuid.uuid4()),
                "name": "meeting_voting",
                "subject": "🗳️ {{meeting_type}} - {{building_name}}",
                "description": "Toplantı veya oylama bildirimi için sakinlere gönderilir",
                "variables": ["user_name", "building_name", "meeting_type", "meeting_title", "meeting_date", "meeting_time", "meeting_location", "meeting_description", "vote_deadline"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .type-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; margin-top: 10px; }
        .content { padding: 40px 30px; }
        .meeting-card { background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); border: 2px solid #8B5CF6; border-radius: 16px; padding: 25px; margin: 25px 0; }
        .meeting-title { font-size: 20px; font-weight: bold; color: #5B21B6; margin-bottom: 20px; }
        .detail-row { display: flex; align-items: center; margin-bottom: 12px; color: #4b5563; }
        .detail-icon { width: 24px; margin-right: 12px; color: #7C3AED; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin: 20px 0; color: #92400E; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗳️ {{meeting_type}}</h1>
            <span class="type-badge">{{building_name}}</span>
        </div>
        <div class="content">
            <p style="color: #4b5563;">Sayın {{user_name}},</p>
            <p style="color: #4b5563;">Aşağıdaki {{meeting_type}} hakkında bilgilendirilmenizi rica ederiz.</p>
            
            <div class="meeting-card">
                <div class="meeting-title">{{meeting_title}}</div>
                <div class="detail-row">
                    <span class="detail-icon">📅</span>
                    <span><strong>Tarih:</strong> {{meeting_date}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">🕐</span>
                    <span><strong>Saat:</strong> {{meeting_time}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    <span><strong>Yer:</strong> {{meeting_location}}</span>
                </div>
                <hr style="border: none; border-top: 1px solid #DDD6FE; margin: 20px 0;">
                <p style="color: #4b5563; margin: 0;">{{meeting_description}}</p>
            </div>
            
            <div class="warning">
                ⚠️ Oylama için son tarih: <strong>{{vote_deadline}}</strong>
            </div>
            
            <div style="text-align: center;">
                <a href="#" class="button">Oylamaya Katıl</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "{{meeting_type}}: {{meeting_title}} - Tarih: {{meeting_date}} {{meeting_time}} - Yer: {{meeting_location}} - Son Oylama: {{vote_deadline}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # 6. Ödeme başarılı bildirimi
            {
                "id": str(uuid.uuid4()),
                "name": "payment_success",
                "subject": "✅ Ödeme Başarılı - {{building_name}}",
                "description": "Aidat ödemesi başarılı olduğunda sakinlere gönderilir",
                "variables": ["user_name", "building_name", "apartment_no", "amount", "payment_date", "payment_method", "receipt_no", "month"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .success-icon { font-size: 48px; margin-bottom: 15px; }
        .content { padding: 40px 30px; }
        .receipt-box { background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .receipt-row:last-child { border-bottom: none; }
        .receipt-total { font-size: 24px; font-weight: bold; color: #059669; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #10B981; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Ödeme Başarılı!</h1>
        </div>
        <div class="content">
            <p style="color: #4b5563;">Sayın {{user_name}},</p>
            <p style="color: #4b5563;">{{building_name}} için {{month}} ayı aidat ödemeniz başarıyla alınmıştır.</p>
            
            <div class="receipt-box">
                <h3 style="margin-top: 0; color: #1f2937; text-align: center;">🧾 Ödeme Makbuzu</h3>
                <div class="receipt-row">
                    <span style="color: #6b7280;">Makbuz No</span>
                    <span style="color: #1f2937; font-weight: 600;">{{receipt_no}}</span>
                </div>
                <div class="receipt-row">
                    <span style="color: #6b7280;">Daire</span>
                    <span style="color: #1f2937;">{{apartment_no}}</span>
                </div>
                <div class="receipt-row">
                    <span style="color: #6b7280;">Dönem</span>
                    <span style="color: #1f2937;">{{month}}</span>
                </div>
                <div class="receipt-row">
                    <span style="color: #6b7280;">Ödeme Tarihi</span>
                    <span style="color: #1f2937;">{{payment_date}}</span>
                </div>
                <div class="receipt-row">
                    <span style="color: #6b7280;">Ödeme Yöntemi</span>
                    <span style="color: #1f2937;">{{payment_method}}</span>
                </div>
                <div class="receipt-total">{{amount}}</div>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">Bu makbuzu yazdırabilir veya kaydedebilirsiniz.</p>
        </div>
        <div class="footer">
            <p>Teşekkür ederiz!</p>
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Ödeme Başarılı! {{building_name}} - Daire {{apartment_no}} - {{month}} ayı: {{amount}} - Makbuz: {{receipt_no}} - Tarih: {{payment_date}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            # 7. Ödeme başarısız bildirimi
            {
                "id": str(uuid.uuid4()),
                "name": "payment_failed",
                "subject": "❌ Ödeme Başarısız - {{building_name}}",
                "description": "Aidat ödemesi başarısız olduğunda sakinlere gönderilir",
                "variables": ["user_name", "building_name", "apartment_no", "amount", "payment_date", "error_message", "month"],
                "body_html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .error-icon { font-size: 48px; margin-bottom: 15px; }
        .content { padding: 40px 30px; }
        .error-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; margin: 25px 0; }
        .error-title { color: #991B1B; font-weight: 600; margin-bottom: 10px; }
        .error-message { color: #DC2626; }
        .info-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .button { display: inline-block; background: #EF4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="error-icon">❌</div>
            <h1>Ödeme Başarısız</h1>
        </div>
        <div class="content">
            <p style="color: #4b5563;">Sayın {{user_name}},</p>
            <p style="color: #4b5563;">{{building_name}} için {{month}} ayı aidat ödemeniz gerçekleştirilemedi.</p>
            
            <div class="error-box">
                <div class="error-title">⚠️ Hata Detayı</div>
                <div class="error-message">{{error_message}}</div>
            </div>
            
            <div class="info-box">
                <div class="info-row">
                    <span style="color: #6b7280;">Daire</span>
                    <span style="color: #1f2937;">{{apartment_no}}</span>
                </div>
                <div class="info-row">
                    <span style="color: #6b7280;">Dönem</span>
                    <span style="color: #1f2937;">{{month}}</span>
                </div>
                <div class="info-row">
                    <span style="color: #6b7280;">Tutar</span>
                    <span style="color: #1f2937; font-weight: 600;">{{amount}}</span>
                </div>
                <div class="info-row">
                    <span style="color: #6b7280;">Deneme Tarihi</span>
                    <span style="color: #1f2937;">{{payment_date}}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="#" class="button">Tekrar Dene</a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px;">Sorun devam ederse lütfen yöneticinizle iletişime geçin.</p>
        </div>
        <div class="footer">
            <p>© 2024 Yönetioo - Akıllı Bina Yönetimi</p>
        </div>
    </div>
</body>
</html>
                """,
                "body_text": "Ödeme Başarısız! {{building_name}} - Daire {{apartment_no}} - {{month}} ayı: {{amount}} - Hata: {{error_message}}",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        inserted_count = 0
        for template in default_templates:
            existing = await db.mail_templates.find_one({"name": template["name"]})
            if not existing:
                await db.mail_templates.insert_one(template)
                inserted_count += 1
        
        return {"message": f"{inserted_count} varsayılan şablon eklendi", "total": len(default_templates)}
    
    return router
