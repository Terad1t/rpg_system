"""
Testes para o módulo de personagem do player
Testa os services e controllers de character do player
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Imports do backend
import sys
sys.path.insert(0, 'backend')

from backend.master.database.connection import Base, get_db
from backend.master.models.character_model import Character
from backend.master.models.character_model import Raca, Classe, Attribute
from backend.player.services.player_character_services import (
    get_player_character,
    update_player_character,
    get_all_player_characters,
)
from backend.player.controllers.player_character_controller import router

# ==================== SETUP DE BANCO DE DADOS ====================

@pytest.fixture(scope="function")
def db_session():
    """
    Cria um banco de dados SQLite em memória para testes
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """
    Cria um cliente de teste FastAPI
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def sample_character(db_session):
    """
    Cria um personagem de teste no banco de dados
    """
    # Cria uma raça (prerequisito)
    raca = Raca(id=1, nome="Humano", descricao="Humano padrão")
    db_session.add(raca)
    db_session.commit()
    
    # Cria uma classe (prerequisito)
    classe = Classe(id=1, nome="Guerreiro", descricao="Classe de combate")
    db_session.add(classe)
    db_session.commit()
    
    # Cria o personagem
    character = Character(
        id=1,
        name="Aragorn",
        age=30,
        tipo="player",
        raca_id=1,
        classe_id=1,
        codename="O Montador",
        description="Um guerreiro nobre",
        user_id="user_123"
    )
    db_session.add(character)
    db_session.commit()
    db_session.refresh(character)
    
    return character


# ==================== TESTES DOS SERVICES ====================

class TestPlayerCharacterServices:
    """
    Testes unitários dos services de personagem do player
    """
    
    def test_get_player_character_success(self, db_session, sample_character):
        """Testa obtenção bem-sucedida de um personagem do player"""
        character = get_player_character(db_session, character_id=1, user_id="user_123")
        
        assert character is not None
        assert character.id == 1
        assert character.name == "Aragorn"
        assert character.user_id == "user_123"
    
    def test_get_player_character_unauthorized(self, db_session, sample_character):
        """Testa tentativa de obter personagem com user_id incorreto"""
        character = get_player_character(db_session, character_id=1, user_id="user_wrong")
        
        assert character is None
    
    def test_get_player_character_not_found(self, db_session):
        """Testa obtenção de personagem inexistente"""
        character = get_player_character(db_session, character_id=999, user_id="user_123")
        
        assert character is None
    
    def test_get_all_player_characters(self, db_session, sample_character):
        """Testa obtenção de todos os personagens do player"""
        characters = get_all_player_characters(db_session, user_id="user_123")
        
        assert len(characters) == 1
        assert characters[0].name == "Aragorn"
    
    def test_get_all_player_characters_empty(self, db_session):
        """Testa obtenção de personagens quando nenhum existe"""
        characters = get_all_player_characters(db_session, user_id="user_empty")
        
        assert len(characters) == 0
    
    def test_update_player_character_codename(self, db_session, sample_character):
        """Testa atualização do codinome do personagem"""
        from backend.master.schemas.character_schema import CharacterUpdateByPlayer
        
        update_data = CharacterUpdateByPlayer(
            codename="O Rei Retornado",
            description=None
        )
        character = update_player_character(
            db_session, 
            character_id=1, 
            user_id="user_123", 
            character_update=update_data
        )
        
        assert character is not None
        assert character.codename == "O Rei Retornado"
        assert character.description == "Um guerreiro nobre"
    
    def test_update_player_character_description(self, db_session, sample_character):
        """Testa atualização da descrição do personagem"""
        from backend.master.schemas.character_schema import CharacterUpdateByPlayer
        
        update_data = CharacterUpdateByPlayer(
            codename=None,
            description="Um ranger lendário dos Dúnedain"
        )
        character = update_player_character(
            db_session, 
            character_id=1, 
            user_id="user_123", 
            character_update=update_data
        )
        
        assert character is not None
        assert character.codename == "O Montador"
        assert character.description == "Um ranger lendário dos Dúnedain"
    
    def test_update_player_character_both_fields(self, db_session, sample_character):
        """Testa atualização de ambos os campos"""
        from backend.master.schemas.character_schema import CharacterUpdateByPlayer
        
        update_data = CharacterUpdateByPlayer(
            codename="Elessar",
            description="Rei do novo reino"
        )
        character = update_player_character(
            db_session, 
            character_id=1, 
            user_id="user_123", 
            character_update=update_data
        )
        
        assert character.codename == "Elessar"
        assert character.description == "Rei do novo reino"
    
    def test_update_player_character_unauthorized(self, db_session, sample_character):
        """Testa tentativa de atualizar personagem com user_id errado"""
        from backend.master.schemas.character_schema import CharacterUpdateByPlayer
        
        update_data = CharacterUpdateByPlayer(
            codename="Novo Nome",
            description=None
        )
        character = update_player_character(
            db_session, 
            character_id=1, 
            user_id="user_wrong", 
            character_update=update_data
        )
        
        assert character is None


# ==================== TESTES DOS ENDPOINTS ====================

class TestPlayerCharacterController:
    """
    Testes de integração dos endpoints da API
    """
    
    def test_get_my_characters_success(self, client, sample_character):
        """Testa obtenção de personagens com user_id válido"""
        response = client.get(
            "/my-characters/",
            headers={"x-user-id": "user_123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Aragorn"
    
    def test_get_my_characters_unauthorized(self, client, sample_character):
        """Testa obtenção de personagens sem header x-user-id"""
        response = client.get("/my-characters/")
        
        assert response.status_code == 422  # Unprocessable Entity (header obrigatório)
    
    def test_get_my_characters_no_characters(self, client):
        """Testa obtenção quando player não tem personagens"""
        response = client.get(
            "/my-characters/",
            headers={"x-user-id": "user_empty"}
        )
        
        assert response.status_code == 404
        assert "No characters found" in response.json()["detail"]
    
    def test_get_my_character_by_id_success(self, client, sample_character):
        """Testa obtenção de um personagem específico"""
        response = client.get(
            "/my-characters/1",
            headers={"x-user-id": "user_123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Aragorn"
        assert data["codename"] == "O Montador"
    
    def test_get_my_character_by_id_unauthorized(self, client, sample_character):
        """Testa obtenção de personagem com user_id incorreto"""
        response = client.get(
            "/my-characters/1",
            headers={"x-user-id": "user_wrong"}
        )
        
        assert response.status_code == 403
        assert "You don't have permission" in response.json()["detail"]
    
    def test_get_my_character_by_id_not_found(self, client):
        """Testa obtenção de personagem inexistente"""
        response = client.get(
            "/my-characters/999",
            headers={"x-user-id": "user_123"}
        )
        
        assert response.status_code == 403
    
    def test_update_my_character_success(self, client, sample_character):
        """Testa atualização bem-sucedida de personagem"""
        update_data = {
            "codename": "Aragorn, Rei de Gondor",
            "description": "Rei restaurado do antigo reino"
        }
        response = client.put(
            "/my-characters/1",
            json=update_data,
            headers={"x-user-id": "user_123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["codename"] == "Aragorn, Rei de Gondor"
        assert data["description"] == "Rei restaurado do antigo reino"
    
    def test_update_my_character_partial(self, client, sample_character):
        """Testa atualização parcial de personagem"""
        update_data = {
            "codename": "Novo Codinome"
        }
        response = client.put(
            "/my-characters/1",
            json=update_data,
            headers={"x-user-id": "user_123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["codename"] == "Novo Codinome"
        assert data["description"] == "Um guerreiro nobre"
    
    def test_update_my_character_unauthorized(self, client, sample_character):
        """Testa tentativa de atualizar personagem com user_id errado"""
        update_data = {
            "codename": "Novo Codinome"
        }
        response = client.put(
            "/my-characters/1",
            json=update_data,
            headers={"x-user-id": "user_wrong"}
        )
        
        assert response.status_code == 403
        assert "You don't have permission" in response.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
