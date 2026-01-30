from datetime import datetime, timedelta, UTC
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db, get_current_user
from app.db.models.user import UserCreate, UserPublic, LoginRequest, TokenResponse
from app.db.models.refresh_token import RefreshToken
from app.db.repositories.user import UserRepository, User
from app.db.repositories.refresh_token import RefreshTokenRepository
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    hash_password,
)
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing_user = await UserRepository.get_by_email_or_login(
        db, data.email
    )
    if existing_user and existing_user.email == data.email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    existing_user = await UserRepository.get_by_email_or_login(
        db, data.login
    )
    if existing_user and existing_user.login == data.login:
        raise HTTPException(
            status_code=400,
            detail="Login already taken",
        )

    user = User(
        email=data.email,
        login=data.login,
        password_hash=hash_password(data.password),
    )

    return await UserRepository.create(db, user)

@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login_user(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await UserRepository.get_by_email_or_login(
        db, data.identifier
    )

    if not user or not verify_password(
        data.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    await UserRepository.limit_active_sessions(db, user.id, max_sessions=5)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    refresh_token_db = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(UTC)
        + timedelta(days=settings.refresh_token_expire_days),
    )

    await RefreshTokenRepository.create(
        db, refresh_token_db
    )

    user.last_login_at = datetime.now(UTC)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        message=f"User logged in {user.login}",
    )
    
@router.post("/logout")
async def logout_user(
    refresh_token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    await RefreshTokenRepository.revoke_by_hash(
        db, hash_token(refresh_token)
    )

    return {"message": "The user has been logged out."}
    
@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    refresh_token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    token_hash = hash_token(refresh_token)

    db_token = await RefreshTokenRepository.get_active(
        db, token_hash
    )

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    await RefreshTokenRepository.revoke(db, db_token)

    access_token = create_access_token(str(db_token.user_id))
    new_refresh_token = create_refresh_token(str(db_token.user_id))

    new_db_token = RefreshToken(
        user_id=db_token.user_id,
        token_hash=hash_token(new_refresh_token),
        expires_at=datetime.now(UTC)
        + timedelta(days=settings.refresh_token_expire_days),
    )

    await RefreshTokenRepository.create(db, new_db_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_id=db_token.user_id,
        message="Refreshed token",
    )

@router.get("/me", response_model=UserPublic)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user