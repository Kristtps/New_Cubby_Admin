#!/usr/bin/env python3
"""
CoinCubby Locker Controller for Raspberry Pi
Monitors Supabase database and controls physical locker hardware via GPIO
"""

import os
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from gpiozero import OutputDevice

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
DEVICE_ID = os.getenv('DEVICE_ID', 'DEV-01')
MODULE_ID = os.getenv('MODULE_ID')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', 2))  # seconds

# GPIO Pin Mapping (customize based on your hardware)
# Format: "locker_code": gpio_pin_number
GPIO_PINS = {
    'L1': 17,  # Large locker 1 → GPIO 17
    'L2': 18,  # Large locker 2 → GPIO 18
    'M1': 27,  # Medium locker 1 → GPIO 27
    'M2': 22,  # Medium locker 2 → GPIO 22
    'S1': 23,  # Small locker 1 → GPIO 23
    'S2': 24,  # Small locker 2 → GPIO 24
    'S3': 25,  # Small locker 3 → GPIO 25
    'S4': 8,   # Small locker 4 → GPIO 8
}

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/coincubby-controller.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('CoinCubby')

class LockerController:
    """Controls physical locker hardware via GPIO pins"""
    
    def __init__(self, gpio_pins: Dict[str, int]):
        self.locks: Dict[str, OutputDevice] = {}
        self.gpio_pins = gpio_pins
        self._initialize_gpio()
    
    def _initialize_gpio(self):
        """Initialize GPIO pins for all lockers"""
        logger.info("Initializing GPIO pins...")
        for locker_code, pin in self.gpio_pins.items():
            try:
                # Create OutputDevice for each lock (active_high=False for relay modules)
                self.locks[locker_code] = OutputDevice(pin, active_high=False, initial_value=False)
                logger.info(f"Initialized {locker_code} on GPIO pin {pin}")
            except Exception as e:
                logger.error(f"Failed to initialize {locker_code} on pin {pin}: {e}")
    
    def unlock(self, locker_code: str, duration: float = 5.0) -> bool:
        """
        Unlock a locker for specified duration
        
        Args:
            locker_code: Code of the locker (e.g., 'L1', 'M2', 'S3')
            duration: How long to keep unlocked (seconds)
        
        Returns:
            True if successful, False otherwise
        """
        if locker_code not in self.locks:
            logger.error(f"Unknown locker code: {locker_code}")
            return False
        
        try:
            logger.info(f"Unlocking {locker_code} for {duration} seconds")
            self.locks[locker_code].on()  # Activate relay (unlock)
            time.sleep(duration)
            self.locks[locker_code].off()  # Deactivate relay (lock)
            logger.info(f"Locked {locker_code}")
            return True
        except Exception as e:
            logger.error(f"Error controlling {locker_code}: {e}")
            return False
    
    def lock(self, locker_code: str) -> bool:
        """
        Immediately lock a locker
        
        Args:
            locker_code: Code of the locker
        
        Returns:
            True if successful, False otherwise
        """
        if locker_code not in self.locks:
            logger.error(f"Unknown locker code: {locker_code}")
            return False
        
        try:
            self.locks[locker_code].off()
            logger.info(f"Locked {locker_code}")
            return True
        except Exception as e:
            logger.error(f"Error locking {locker_code}: {e}")
            return False
    
    def get_status(self, locker_code: str) -> Optional[bool]:
        """
        Get current lock status
        
        Args:
            locker_code: Code of the locker
        
        Returns:
            True if unlocked, False if locked, None if unknown
        """
        if locker_code not in self.locks:
            return None
        return self.locks[locker_code].is_active
    
    def cleanup(self):
        """Clean up GPIO resources"""
        logger.info("Cleaning up GPIO...")
        for locker_code, lock in self.locks.items():
            try:
                lock.off()  # Ensure all locks are locked
                lock.close()
                logger.info(f"Cleaned up {locker_code}")
            except Exception as e:
                logger.error(f"Error cleaning up {locker_code}: {e}")


class DatabaseMonitor:
    """Monitors Supabase database for locker status changes"""
    
    def __init__(self, supabase_client: Client, controller: LockerController, module_id: str):
        self.client = supabase_client
        self.controller = controller
        self.module_id = module_id
        self.last_check = datetime.now()
    
    def get_lockers(self) -> List[Dict]:
        """Fetch all lockers for this module from database"""
        try:
            response = self.client.table('lockers') \
                .select('*') \
                .eq('module_id', self.module_id) \
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching lockers: {e}")
            return []
    
    def get_pending_unlocks(self) -> List[Dict]:
        """Get lockers that need to be unlocked (status = 'payment')"""
        try:
            response = self.client.table('lockers') \
                .select('*') \
                .eq('module_id', self.module_id) \
                .eq('status', 'Payment') \
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching pending unlocks: {e}")
            return []
    
    def update_locker_status(self, locker_id: str, status: str) -> bool:
        """Update locker status in database"""
        try:
            self.client.table('lockers') \
                .update({'status': status}) \
                .eq('locker_id', locker_id) \
                .execute()
            logger.info(f"Updated locker {locker_id} to status: {status}")
            return True
        except Exception as e:
            logger.error(f"Error updating locker status: {e}")
            return False
    
    def process_unlock_requests(self):
        """Process any pending unlock requests"""
        pending = self.get_pending_unlocks()
        
        for locker in pending:
            locker_code = locker.get('locker_number') or locker.get('code')
            locker_id = locker.get('locker_id')
            
            logger.info(f"Processing unlock request for {locker_code}")
            
            # Unlock the physical locker
            success = self.controller.unlock(locker_code, duration=5.0)
            
            if success:
                # Update status to 'Occupied' after successful unlock
                self.update_locker_status(locker_id, 'Occupied')
            else:
                logger.error(f"Failed to unlock {locker_code}")


def main():
    """Main execution loop"""
    logger.info("=" * 60)
    logger.info("CoinCubby Locker Controller Starting...")
    logger.info(f"Device ID: {DEVICE_ID}")
    logger.info(f"Module ID: {MODULE_ID}")
    logger.info("=" * 60)
    
    # Validate configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Missing Supabase credentials in environment variables")
        return
    
    if not MODULE_ID:
        logger.error("Missing MODULE_ID in environment variables")
        return
    
    # Initialize Supabase client
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Connected to Supabase")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        return
    
    # Initialize hardware controller
    controller = LockerController(GPIO_PINS)
    
    # Initialize database monitor
    monitor = DatabaseMonitor(supabase, controller, MODULE_ID)
    
    logger.info("System initialized successfully")
    logger.info(f"Monitoring database every {POLL_INTERVAL} seconds...")
    
    try:
        # Main monitoring loop
        while True:
            try:
                # Check for unlock requests
                monitor.process_unlock_requests()
                
                # Wait before next check
                time.sleep(POLL_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("Received shutdown signal")
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(POLL_INTERVAL)
    
    finally:
        # Cleanup
        logger.info("Shutting down...")
        controller.cleanup()
        logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
