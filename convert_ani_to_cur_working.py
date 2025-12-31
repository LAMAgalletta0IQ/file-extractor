#!/usr/bin/env python3
"""
Script per convertire .ani in .cur - versione funzionante
"""

from pathlib import Path
import struct

def extract_cur_from_ani(ani_path):
    """Estrae dati CUR da un file .ani"""
    with open(ani_path, 'rb') as f:
        data = f.read()
    
    # Cerca magic numbers in tutto il file
    cur_magic = b'\x00\x00\x02\x00'
    ico_magic = b'\x00\x00\x01\x00'
    
    positions = []
    
    # Cerca tutte le occorrenze di CUR
    pos = 0
    while True:
        pos = data.find(cur_magic, pos)
        if pos == -1:
            break
        positions.append((pos, False))  # False = non è ICO
        pos += 1
    
    # Cerca tutte le occorrenze di ICO
    pos = 0
    while True:
        pos = data.find(ico_magic, pos)
        if pos == -1:
            break
        positions.append((pos, True))  # True = è ICO
        pos += 1
    
    # Ordina per posizione
    positions.sort(key=lambda x: x[0])
    
    # Prova ogni posizione fino a trovarne una valida
    for pos, is_ico in positions:
        try:
            if len(data) < pos + 6:
                continue
            
            # Leggi numero di immagini
            num_images = struct.unpack('<H', data[pos+4:pos+6])[0]
            if num_images == 0 or num_images > 100:
                continue
            
            # Verifica che ci sia spazio per la directory
            if len(data) < pos + 6 + (num_images * 16):
                continue
            
            # Verifica che la directory sembri valida (controlla il primo entry)
            first_entry = data[pos+6:pos+22]
            # Un entry ICO/CUR valido ha dimensioni ragionevoli
            width = first_entry[0] if first_entry[0] != 0 else 256
            height = first_entry[1] if first_entry[1] != 0 else 256
            
            if width > 256 or height > 256:
                continue
            
            # Sembra valido! Estrai i dati
            # Calcola dimensione: header + directory + stima immagini
            min_size = 6 + (num_images * 16)
            
            # Trova dimensione massima immagine
            max_img_size = 0
            for i in range(num_images):
                dir_pos = pos + 6 + (i * 16)
                if dir_pos + 16 > len(data):
                    break
                img_size = struct.unpack('<I', data[dir_pos+8:dir_pos+12])[0]
                if img_size > 0 and img_size < 10*1024*1024:  # Max 10MB per sicurezza
                    max_img_size = max(max_img_size, img_size)
            
            # Estrai tutto
            estimated_size = min_size + max(max_img_size, 2048)  # Almeno 2KB
            estimated_size = min(estimated_size, len(data) - pos)
            
            result = bytearray(data[pos:pos+estimated_size])
            
            # Se era ICO, convertilo in CUR
            if is_ico:
                result[2:4] = b'\x02\x00'
            
            return bytes(result)
        except:
            continue
    
    return None

def convert_ani_to_cur(ani_path, cur_path):
    """Converte .ani in .cur"""
    try:
        cur_data = extract_cur_from_ani(ani_path)
        
        if cur_data and len(cur_data) >= 6:
            with open(cur_path, 'wb') as out:
                out.write(cur_data)
            return True
        else:
            return False
    except Exception as e:
        print(f"    Errore: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    cursors_dir = Path(__file__).parent / "ui" / "public" / "cursors"
    
    if not cursors_dir.exists():
        print(f"Cartella non trovata: {cursors_dir}")
        return
    
    ani_files = list(cursors_dir.glob("*.ani"))
    
    if not ani_files:
        print("Nessun file .ani trovato")
        return
    
    print(f"Trovati {len(ani_files)} file .ani da convertire...\n")
    
    success_count = 0
    for ani_file in ani_files:
        cur_file = ani_file.with_suffix('.cur')
        print(f"Convertendo {ani_file.name} -> {cur_file.name}...")
        
        if convert_ani_to_cur(ani_file, cur_file):
            file_size = cur_file.stat().st_size
            print(f"  [OK] Convertito con successo ({file_size} bytes)")
            success_count += 1
        else:
            print(f"  [ERR] Errore nella conversione")
        print()
    
    print(f"Completato: {success_count}/{len(ani_files)} file convertiti")

if __name__ == "__main__":
    main()

