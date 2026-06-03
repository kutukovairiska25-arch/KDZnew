from sqlalchemy.orm import Session
import models

# Промежуточный класс для унификации результата поиска
class UserResult:
    def __init__(self, id, login, password_hash, role, user_type):
        self.id = id
        self.login = login
        self.password_hash = password_hash
        self.role = role
        self.user_type = user_type

def get_user_by_login(db: Session, login: str):
    # 1. Ищем в таблице сотрудников
    emp = db.query(models.Employee).filter(models.Employee.login == login).first()
    if emp:
        return UserResult(
            id=emp.employees_id,
            login=emp.login,
            password_hash=emp.password_hash,
            role=emp.employees_role,
            user_type="employee"
        )

    # 2. Ищем в таблице покупателей
    cust = db.query(models.Customer).filter(models.Customer.login == login).first()
    if cust:
        return UserResult(
            id=cust.customers_id,
            login=cust.login,
            password_hash=cust.password_hash,
            role="customer",
            user_type="customer"
        )

    return None

def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password