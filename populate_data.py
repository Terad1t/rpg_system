"""
Script para popular raças e classes iniciais no banco de dados
"""
import sys
sys.path.insert(0, '.')

from backend.master.database.connection import SessionLocal
from backend.master.models.raca_model import Raca
from backend.master.models.classe_model import Classe

db = SessionLocal()

# Verifica se já existem raças
existing_races = db.query(Raca).count()
if existing_races == 0:
    print("Populando raças...")
    races = [
        Raca(name="Humano", description="Versátil e adaptável"),
        Raca(name="Elfo", description="Ágil e sábio"),
        Raca(name="Anão", description="Forte e resistente"),
        Raca(name="Orc", description="Poderoso e feroz"),
        Raca(name="Meio-Elfo", description="Combinação de humano e elfo"),
    ]
    for race in races:
        db.add(race)
    db.commit()
    print(f"Adicionadas {len(races)} raças")
else:
    print(f"Raças já existem: {existing_races}")

# Verifica se já existem classes
existing_classes = db.query(Classe).count()
if existing_classes == 0:
    print("Populando classes...")
    classes = [
        Classe(name="Guerreiro", description="Especialista em combate corpo a corpo"),
        Classe(name="Mago", description="Manipulador de magia"),
        Classe(name="Arqueiro", description="Especialista em arco e flecha"),
        Classe(name="Ladino", description="Rápido e furtivo"),
        Classe(name="Clérigo", description="Curador e devoto"),
        Classe(name="Paladino", description="Guerreiro sagrado"),
    ]
    for classe in classes:
        db.add(classe)
    db.commit()
    print(f"Adicionadas {len(classes)} classes")
else:
    print(f"Classes já existem: {existing_classes}")

db.close()
print("✅ Banco de dados populado com sucesso!")
