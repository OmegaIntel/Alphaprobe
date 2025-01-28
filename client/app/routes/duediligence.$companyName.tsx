import CustomReportLayout from "~/components/Dashboard/CustomReport/CustomReportLayout";
import { useNavigate, useParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";

export default function DueDeligence() {
  const { companyName } = useParams();
  
  return (
    <div>
      {/* <div className="flex justify-end my-5">
       <Button onClick={()=>{navigate("/dashboard")}}>Back to DashBoard</Button>
      </div> */}
      <div>
        <CustomReportLayout companyName={`${companyName}`} />
      </div>
    </div>
  );
}