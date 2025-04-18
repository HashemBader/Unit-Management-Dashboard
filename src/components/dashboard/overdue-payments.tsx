
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  customer: string;
  unit: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
}

interface OverduePaymentsProps {
  payments: Payment[];
  className?: string;
}

export function OverduePayments({ payments, className }: OverduePaymentsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Overdue Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.customer}</TableCell>
                <TableCell>{payment.unit}</TableCell>
                <TableCell>{payment.dueDate}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    {payment.daysOverdue} days overdue
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
