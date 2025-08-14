
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentForm from '@/components/PaymentForm';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentTest() {
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState(50);
  const [description, setDescription] = useState('Test appointment booking');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-textSecondary">
              Please sign in to test payments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePaymentSuccess = (paymentIntent: any) => {
    console.log('Payment successful:', paymentIntent);
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Integration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => setShowPaymentForm(true)}
              className="w-full"
              disabled={amount <= 0}
            >
              Start Payment Process
            </Button>
          </CardContent>
        </Card>

        {showPaymentForm && (
          <PaymentForm
            amount={amount}
            description={description}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}
      </div>
    </div>
  );
}
