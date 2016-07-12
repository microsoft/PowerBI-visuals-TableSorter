import { JSONDataProvider } from "./providers/JSONDataProvider";
import { IQueryOptions, IQueryResult/*, ITableSorterSort, ITableSorterFilter*/} from "./models";
// import { Promise } from "es6-promise";
import { LOAD_COUNT } from "./TableSorterVisual.defaults";

/**
 * The data provider for our lineup instance
 */
export default class MyDataProvider extends JSONDataProvider {

    // private onLoadMoreData: (options: IQueryOptions, newQuery: boolean, sort: boolean, filter: boolean) => PromiseLike<any[]>;
    private hasMoreData: (newQuery: boolean) => boolean;
    // private newQuery = false;
    // private firstLoad = true;
    // private sortChanged = false;
    // private filterChanged = false;

    constructor(
        data: any[],
        hasMoreData: (newQuery: boolean) => boolean,
        onLoadMoreData: (options: IQueryOptions, newQuery: boolean, sort: boolean, filter: boolean) => PromiseLike<any[]>) {
        super(data, true, true, LOAD_COUNT);
        // this.onLoadMoreData = onLoadMoreData;
        this.hasMoreData = hasMoreData;
    }

    /**
     * Determines if the dataset can be queried again
     */
    public canQuery(options: IQueryOptions): PromiseLike<boolean> {
        // We are either loading our initial set, which of course you can query it, otherwise, see if there is more data available
        // const canLoad = this.firstLoad;// || this.hasMoreData(false/*this.newQuery*/);
        // return new Promise<boolean>((resolve) => resolve(canLoad));
        return super.canQuery(options);
    }

    /**
     * Runs a query against the server
     */
    public query(options: IQueryOptions): PromiseLike<IQueryResult> {
        // // Since it is the first load, we are just loading the initial set of data
        // if (this.firstLoad) {
        //     this.firstLoad = false;
        //     return super.query(options);
        // }
        // // Otherwise get more from the table sorter
        // // const newQuery = false;//this.newQuery;
        // // const filterChanged = this.filterChanged;
        // // const sortChanged = this.sortChanged;
        // this.filterChanged = this.sortChanged = this.newQuery = false;
        // if (sortChanged || filterChanged) {
            return super.query(options);
        // } else {
        //     return this.onLoadMoreData(options, newQuery, false, false/*sortChanged, filterChanged*/).then(n => {
        //         this.data = n;
        //         return super.query(options);
        //     });
        // }
    };

    // /**
    //  * Called when the data should be sorted
    //  */
    // public sort(sort?: ITableSorterSort) {
    //     super.sort(sort);
    //     this.newQuery = true;
    //     this.sortChanged = true;
    //     // this.sortChanged = this.onSorted(sort);
    // }

    // /**
    //  * Called when the data is filtered
    //  */
    // public filter(filter?: ITableSorterFilter) {
    //     super.filter(filter);
    //     this.newQuery = true;
    //     this.filterChanged = true;
    //     // this.filterChanged = this.onFiltered(filter);
    // }
}
