# services/player_service.py

players = []
player_id_counter = 1

def get_players(alive_only: bool = True, min_hp: int = 0):
    """Business rules for fetching players:"""
    filtered = players

    # regra 1: se alive_only, só retorna jogadores vivos (hp > 0)
    if alive_only:
        filtered = [p for p in filtered if p["hp"] > 0]

    # regra 2: aplica hp mínimo
    if min_hp is not None and min_hp > 0:
        filtered = [p for p in filtered if p["hp"] >= min_hp]

    # regra 3: ordena para previsibilidade (hp desc, nome asc)
    filtered = sorted(filtered, key=lambda p: (-p["hp"], p["name"]))

    return filtered

def create_player(data):
    global player_id_counter
    player = {
        "id": player_id_counter,
        "name": data.name,
        "hp": data.hp
    }
    players.append(player)
    player_id_counter += 1
    return player

def update_player(player_id, data):
    for player in players:
        if player["id"] == player_id:
            if data.name is not None:
                player["name"] = data.name
            if data.hp is not None:
                player["hp"] = data.hp
            return player
    return None

def delete_player(player_id):
    for player in players:
        if player["id"] == player_id:
            players.remove(player)
            return True
    return False