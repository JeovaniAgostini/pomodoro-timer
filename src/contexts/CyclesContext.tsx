import { differenceInSeconds } from "date-fns";
import {
    createContext,
    ReactNode,
    useEffect,
    useReducer,
    useState,
} from "react";
import {
    addNewCycleAction,
    interruptCurrentCycleAction,
    markCurrentCycleAsFinishedAction,
} from "../reducers/cycles/actions";
import { Cycle, cyclesReducer } from "../reducers/cycles/reducer";

interface CreateCycleData {
    task: string;
    minutesAmount: number;
}

interface CyclesContextType {
    cycles: Cycle[];
    activeCycle: Cycle | undefined;
    activeCycleId: string | null;
    amountSecondsPassed: number;
    markCurrentCycleAsFinished: () => void;
    setSecondsPassed: (seconds: number) => void;
    createNewCycle: (data: CreateCycleData) => void;
    interruptCurrentCycle: () => void;
}

export const CyclesContext = createContext({} as CyclesContextType);

interface CyclesContextProviderProps {
    children: ReactNode;
}

/*
    O Versionamento no nome foi usado caso no
    futuro o formato dos dados mude, pois se
    algo for modificado na aplicação e o nome
    do storage não for mudado significa que
    vamos estar tentando ler o formato antigo
    de dados, do antigo storage, porém não será
    compatível com o novo formato da atualização.
*/
const storageName = "@pomodoro-timer:cycles-state-1.0.0";

export function CyclesContextProvider({
    children,
}: CyclesContextProviderProps) {
    const [cyclesState, dispatch] = useReducer(
        cyclesReducer,
        {
            cycles: [],
            activeCycleId: null,
        },
        () => {
            const storedStateAsJSON = localStorage.getItem(storageName);

            if (storedStateAsJSON) {
                return JSON.parse(storedStateAsJSON);
            }

            // return {
            //     cycles: [],
            //     activeCycleId: null,
            // };
        }
    );

    const { cycles, activeCycleId } = cyclesState;
    const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId);

    const [amountSecondsPassed, setAmountSecondsPassed] = useState(() => {
        if (activeCycle) {
            return differenceInSeconds(
                new Date(),
                new Date(activeCycle.startDate)
            );
        }

        return 0;
    });

    useEffect(() => {
        const stateJSON = JSON.stringify(cyclesState);

        localStorage.setItem(storageName, stateJSON);
    }, [cyclesState]);

    function setSecondsPassed(seconds: number) {
        setAmountSecondsPassed(seconds);
    }

    function markCurrentCycleAsFinished() {
        dispatch(markCurrentCycleAsFinishedAction());
    }

    function createNewCycle(data: CreateCycleData) {
        const CycleId = String(new Date().getTime());

        const newCycle: Cycle = {
            id: CycleId,
            task: data.task,
            minutesAmount: data.minutesAmount,
            startDate: new Date(),
        };

        dispatch(addNewCycleAction(newCycle));

        setAmountSecondsPassed(0);
    }

    function interruptCurrentCycle() {
        dispatch(interruptCurrentCycleAction());
    }

    return (
        <CyclesContext.Provider
            value={{
                cycles,
                activeCycle,
                activeCycleId,
                amountSecondsPassed,
                markCurrentCycleAsFinished,
                setSecondsPassed,
                createNewCycle,
                interruptCurrentCycle,
            }}
        >
            {children}
        </CyclesContext.Provider>
    );
}
