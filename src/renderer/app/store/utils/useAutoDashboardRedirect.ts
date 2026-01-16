import { useSelector } from "react-redux"
import { getAccessibleModuleCodes,isInPatientMode } from "./contextSelectors"
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routeConstants";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import {navigate as navigateContent} from '../slices/moduleNavigationSlice';

export const useAutoDashboardRedirect=()=>{
    const accessibleModuleCodes=useSelector(getAccessibleModuleCodes);
    const dispatch = useDispatch<AppDispatch>();
    const inPatientMode=useSelector(isInPatientMode);
    const firstModuleCode=accessibleModuleCodes[0];
    const navigate=useNavigate();

    switch(firstModuleCode){
        case 'medical_records':
            dispatch(navigateContent({operation:'overview'}));
            navigate(ROUTES.MEDICAL_RECORDS);
            break;
        case 'nursing':
            dispatch(navigateContent({operation:'overview'}));
            navigate(ROUTES.NURSING);
            break;
        case 'clinical':
            navigate(ROUTES.BILLING);
            break;
        case 'laboratory':
            dispatch(navigateContent({operation:'overview'}));
            navigate(ROUTES.LABORATORY);
            break;
        case 'pharmacy':
            dispatch(navigateContent({operation:'overview'}));
            navigate(ROUTES.PHARMACY);
            break;
        case 'billing':
            dispatch(navigateContent({operation:'overview'}));
            navigate(ROUTES.BILLING);
            break;
        case 'administration':
            dispatch(navigateContent({operation:'overview'}));
            navigate(ROUTES.ADMINISTRATION);
            break;
        default:
            if(inPatientMode){
                dispatch(navigateContent({operation:'overview'}));
                navigate(ROUTES.PATIENT_DASHBOARD)
            }
    }

}

