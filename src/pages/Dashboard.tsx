import { useEffect, useState } from "react";
import axios from "axios";
import ChartTest from "../components/ChartTest";
import MyLotsTable from "../components/MyLotsTable";
import { Dropdown } from "primereact/dropdown";
// import { useAppSelector } from "../redux/hooks";

interface Props {
  month: string;
}
// const parking_session = useAppSelector(state => state.pay.passion_number);
// console.log(parking_session);

const MonthlyPortal: React.FC<Props> = ({ month }) => {
  return (
    <div className="flex flex-col w-full min-w-[200px] gap-2 bg-white p-4 rounded-md cursor-pointer hover:bg-[#c4c4c4]">
      <div className="flex items-center gap-6">
        <div className="flex justify-center items-center w-10 h-10 rounded-full bg-[#22cbad]">
          <svg className="w-4 h-4 fill-white">
            <use href="#svg-calendar" />
          </svg>
        </div>
        <span className="font-bold">{month}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 fill-[#222]">
          <use href="#svg-car" />
        </svg>
        <span className="text-xs">
          Parking Sessions: <strong>12324</strong>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 p-[2px] fill-[#222]">
          <use href="#svg-exclamation" />
        </svg>
        <span className="text-xs">
          Violation: <strong>167</strong>
        </span>
      </div>
    </div>
  );
};
const Dashboard = () => {
  const [lots, setLots] = useState([]);

  const [selectedLot, setSelectedLot] = useState();

  const fetchLot = async () => {
    const { data } = await axios.get(`/lot`);
    setLots(data);
  };

  useEffect(() => {
    fetchLot();
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between gap-4 w-full overflow-x-auto">
        <MonthlyPortal month="January" />
        <MonthlyPortal month="February" />
        <MonthlyPortal month="March" />
        <MonthlyPortal month="April" />
        <MonthlyPortal month="May" />
        <MonthlyPortal month="June" />
        <MonthlyPortal month="July" />
        <MonthlyPortal month="August" />
        <MonthlyPortal month="September" />
        <MonthlyPortal month="October" />
        <MonthlyPortal month="November" />
        <MonthlyPortal month="December" />
      </div>

      <Dropdown
        pt={{ root: { className: "border border-black" } }}
        value={selectedLot ? selectedLot : lots[0]}
        onChange={(e) => setSelectedLot(e.target.value)}
        options={lots}
        optionLabel="siteCode"
        placeholder="Select a lot"
        className="w-full md:w-14rem"
      />

      <ChartTest selectedLot={selectedLot} />
      <div className="w-full">
        <MyLotsTable />
      </div>
    </>
  );
};
export default Dashboard;
