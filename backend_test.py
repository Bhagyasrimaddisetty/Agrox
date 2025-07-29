#!/usr/bin/env python3
"""
AgroX Backend API Testing Suite
Tests all backend endpoints for the satellite-aided fintech platform
"""

import requests
import sys
import json
from datetime import datetime

class AgroXAPITester:
    def __init__(self, base_url="https://10ab92a3-101b-4e56-8a68-2655046506cf.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.sample_plot_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "api/health",
            200
        )
        if success and response.get('status') == 'healthy':
            print("   ✓ Health status confirmed")
        return success

    def test_farm_plots_retrieval(self):
        """Test farm plots retrieval"""
        success, response = self.run_test(
            "Farm Plots Retrieval",
            "GET", 
            "api/farm-plots",
            200
        )
        if success:
            plots = response.get('plots', [])
            print(f"   ✓ Retrieved {len(plots)} farm plots")
            if plots:
                self.sample_plot_id = plots[0]['id']
                print(f"   ✓ Sample plot ID: {self.sample_plot_id}")
                print(f"   ✓ Sample plot: {plots[0]['farm_name']} - {plots[0]['crop_type']}")
        return success

    def test_satellite_data_generation(self):
        """Test satellite data generation"""
        if not self.sample_plot_id:
            print("❌ No sample plot ID available for satellite data test")
            return False
            
        success, response = self.run_test(
            "Satellite Data Generation",
            "GET",
            f"api/satellite-data/{self.sample_plot_id}",
            200,
            params={"days": 30}
        )
        if success:
            readings = response.get('readings', [])
            print(f"   ✓ Generated {len(readings)} satellite readings")
            if readings:
                latest = readings[-1]
                print(f"   ✓ Latest NDVI: {latest.get('ndvi_value')}")
                print(f"   ✓ Latest crop health: {latest.get('crop_health_score')}%")
                print(f"   ✓ Latest soil moisture: {latest.get('soil_moisture')}")
        return success

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        success, response = self.run_test(
            "Dashboard Summary",
            "GET",
            "api/dashboard-summary", 
            200
        )
        if success:
            print(f"   ✓ Total plots: {response.get('total_plots', 0)}")
            print(f"   ✓ Total acres: {response.get('total_acres', 0)}")
            print(f"   ✓ Avg crop health: {response.get('avg_crop_health', 0)}%")
            print(f"   ✓ Active loans: {response.get('active_loans', 0)}")
        return success

    def test_credit_application_submission(self):
        """Test credit application submission"""
        if not self.sample_plot_id:
            print("❌ No sample plot ID available for credit application test")
            return False

        application_data = {
            "plot_id": self.sample_plot_id,
            "farmer_name": "Test Farmer",
            "farmer_email": "test@example.com",
            "requested_amount": 50000,
            "purpose": "equipment"
        }

        success, response = self.run_test(
            "Credit Application Submission",
            "POST",
            "api/credit-application",
            200,
            data=application_data
        )
        if success:
            print(f"   ✓ Application ID: {response.get('application_id')}")
            print(f"   ✓ Status: {response.get('status')}")
            print(f"   ✓ Approved amount: ${response.get('approved_amount', 0):,}")
            print(f"   ✓ Interest rate: {response.get('interest_rate')}%")
            print(f"   ✓ Crop health score: {response.get('crop_health_score')}%")
            print(f"   ✓ Risk level: {response.get('risk_level')}")
        return success

    def test_insurance_quote_generation(self):
        """Test insurance quote generation"""
        if not self.sample_plot_id:
            print("❌ No sample plot ID available for insurance quote test")
            return False

        success, response = self.run_test(
            "Insurance Quote Generation",
            "GET",
            f"api/insurance-quote/{self.sample_plot_id}",
            200,
            params={"coverage_amount": 100000}
        )
        if success:
            print(f"   ✓ Quote ID: {response.get('id')}")
            print(f"   ✓ Coverage amount: ${response.get('coverage_amount', 0):,}")
            print(f"   ✓ Premium amount: ${response.get('premium_amount', 0):,}")
            print(f"   ✓ Premium rate: {response.get('premium_rate')}%")
            print(f"   ✓ Risk level: {response.get('risk_level')}")
            print(f"   ✓ Crop health score: {response.get('crop_health_score')}%")
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting AgroX Backend API Tests")
        print("=" * 50)

        # Test sequence
        tests = [
            ("API Health Check", self.test_health_endpoint),
            ("Farm Plots Retrieval", self.test_farm_plots_retrieval),
            ("Satellite Data Generation", self.test_satellite_data_generation),
            ("Dashboard Summary", self.test_dashboard_summary),
            ("Credit Application", self.test_credit_application_submission),
            ("Insurance Quote", self.test_insurance_quote_generation)
        ]

        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")

        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = AgroXAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())