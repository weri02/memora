"""Tests unitarios del servicio de autenticacion (hashing y JWT)."""
import uuid

from app.services.auth_service import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_password_produces_different_string(self):
        password = "secret123"
        hashed = hash_password(password)

        assert hashed != password
        assert hashed.startswith("$2b$"), "Debe usar bcrypt"

    def test_verify_password_with_correct_password(self):
        password = "secret123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_with_wrong_password(self):
        hashed = hash_password("secret123")

        assert verify_password("wrong_password", hashed) is False

    def test_hash_is_deterministic_per_call(self):
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")

        assert h1 != h2
        assert verify_password("same_password", h1)
        assert verify_password("same_password", h2)


class TestJWT:
    def test_create_and_decode_token_roundtrip(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)

        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert "exp" in payload

    def test_decode_invalid_token_returns_none(self):
        result = decode_token("not.a.valid.jwt")

        assert result is None

    def test_decode_tampered_token_returns_none(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        tampered = token[:-5] + "XXXXX"

        result = decode_token(tampered)

        assert result is None
