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
